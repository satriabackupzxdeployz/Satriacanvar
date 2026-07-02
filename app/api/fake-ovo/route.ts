import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

const W = 841, H = 1870;

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const f = path.join(FONTS, "PlusJakartaSans.ttf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "JakartaSans");
  fontsLoaded = true;
}

function formatAmount(input: string) {
  const digits = String(input).replace(/[^\d]/g, "") || "0";
  return digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const amount = formatAmount(String(body.amount ?? "5000000"));
    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "ovo", "bg.jpg"));
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.fillStyle   = "#FFFFFF";
    ctx.textAlign   = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `800 20px JakartaSans`;
    ctx.fillText("Rp", 61, 368);
    const rpW = (ctx.measureText("Rp") as { width: number }).width;
    ctx.font = `800 28px JakartaSans`;
    ctx.fillText(amount, 61 + rpW + 6, 371);
    const buffer = await canvas.encode("png");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": "inline; filename=\"fake-ovo.png\"",
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
  const amount = searchParams.get("amount");
  if (!amount?.trim()) return NextResponse.json({ error: "Parameter 'amount' wajib diisi", example: "/api/fake-ovo?amount=5000000" }, { status: 400 });
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  }));
}
