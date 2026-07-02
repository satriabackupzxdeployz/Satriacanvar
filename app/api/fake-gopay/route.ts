import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const reg   = path.join(FONTS, "rupa_sans_regular.ttf");
  const sb    = path.join(FONTS, "rupa_sans_semi_bold.ttf");
  const serif = path.join(FONTS, "rupa_serif_semi_bold.ttf");
  if (fs.existsSync(reg))   GlobalFonts.registerFromPath(reg,   "RupaSans");
  if (fs.existsSync(sb))    GlobalFonts.registerFromPath(sb,    "RupaSans");
  if (fs.existsSync(serif)) GlobalFonts.registerFromPath(serif, "RupaSerif");
  fontsLoaded = true;
}

function formatRp(input: string) {
  const digits = String(input).replace(/[^\d]/g, "") || "0";
  return digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const saldo    = formatRp(String(body.saldo    ?? "890000"));
    const koin     = String(body.koin     ?? "159").replace(/[^\d]/g, "");
    const terpakai = formatRp(String(body.terpakai ?? "0"));
    const bulan    = String(body.bulan    ?? "Mei").trim().slice(0, 20);

    ensureFonts();

    const bgPath = path.join(ASSETS, "gopay", "bg.jpg");
    const bg     = await loadImage(bgPath);
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    ctx.fillStyle   = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign   = "left";

    ctx.font = `800 34px RupaSans`;
    ctx.fillText("Rp", 62, 325 - 38);
    const rpW = (ctx.measureText("Rp") as { width: number }).width;

    ctx.font = `800 95px RupaSerif`;
    ctx.fillText(saldo, 62 + rpW + 8, 325);
    const angkaW = (ctx.measureText(saldo) as { width: number }).width;
    void angkaW;

    ctx.font = `800 34px RupaSans`;
    ctx.fillText(koin, 115, 400);
    const koinW = (ctx.measureText(koin) as { width: number }).width;
    ctx.font = `400 34px RupaSans`;
    ctx.fillText(" Coins", 115 + koinW, 400);

    ctx.font = `800 34px RupaSans`;
    const rpTpText = `Rp${terpakai}`;
    const rpTpW    = (ctx.measureText(rpTpText) as { width: number }).width;
    ctx.fillText(rpTpText, 90, 540);
    ctx.font = `400 34px RupaSans`;
    ctx.fillText(` udah terpakai di ${bulan}`, 90 + rpTpW, 540);

    const buffer = await canvas.encode("jpeg");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/jpeg",
        "Content-Disposition": "inline; filename=\"fake-gopay.jpg\"",
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saldo:    searchParams.get("saldo"),
      koin:     searchParams.get("koin"),
      terpakai: searchParams.get("terpakai"),
      bulan:    searchParams.get("bulan"),
    }),
  }));
}
