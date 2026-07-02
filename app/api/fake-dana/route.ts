import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const f = path.join(FONTS, "dana-saldo.ttf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "DanaFont");
  fl = true;
}

function fmtRp(input: string) {
  const digits = String(input).replace(/[^\d]/g, "") || "0";
  return digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const amount = fmtRp(String(body.amount ?? "0"));
    const nama   = String(body.nama ?? "").trim().slice(0, 30);

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "dana", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    ctx.fillStyle    = "#ffffff";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign    = "left";

    const baseX = 65;

    ctx.font = "bold 16px DanaFont";
    ctx.fillText(nama ? `Saldo ${nama}` : "Saldo kamu", baseX, 62);

    ctx.font = "bold 30px DanaFont";
    ctx.fillText(`Rp ${amount}`, baseX, 96);

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"fake-dana.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const amount = searchParams.get("amount");
  if (!amount?.trim()) return NextResponse.json({ error: "Parameter 'amount' wajib diisi" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, nama: searchParams.get("nama") }) }));
}
