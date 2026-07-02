import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const f1 = path.join(FONTS, "bangjago1.otf");
  const f2 = path.join(FONTS, "bangjago2.ttf");
  if (fs.existsSync(f1)) GlobalFonts.registerFromPath(f1, "BangjagoCustom");
  if (fs.existsSync(f2)) GlobalFonts.registerFromPath(f2, "BangjagoGreeting");
  fl = true;
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const nama   = String(body.nama   ?? "").trim().slice(0, 30);
    const saldo  = String(body.saldo  ?? "0").replace(/[^\d]/g, "");
    if (!nama)  return NextResponse.json({ error: "Parameter 'nama' wajib diisi"  }, { status: 400 });
    if (!saldo) return NextResponse.json({ error: "Parameter 'saldo' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "bangjago", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    const saldoFmt = Number(saldo).toLocaleString("id-ID");
    const hour     = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false });
    const h        = Number(hour);
    let waktu = "Malam";
    if (h >= 4 && h < 11) waktu = "Pagi";
    else if (h >= 11 && h < 15) waktu = "Siang";
    else if (h >= 15 && h < 18) waktu = "Sore";
    const greet = `Selamat ${waktu}, ${nama}`;

    ctx.font      = "125px BangjagoCustom";
    ctx.fillStyle = "black";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const baseX = 2470, baseY = 894;
    const numW  = (ctx.measureText(saldoFmt) as { width: number }).width;
    const numX  = baseX - numW;
    ctx.fillText(saldoFmt, numX, baseY);

    const rpW = (ctx.measureText("Rp") as { width: number }).width;
    ctx.fillText("Rp", numX - rpW - 4, baseY);

    ctx.font = "93px BangjagoGreeting";
    ctx.fillStyle = "gray";
    ctx.fillText(greet, 98, 86);

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"bangjago.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nama  = searchParams.get("nama");
  const saldo = searchParams.get("saldo");
  if (!nama?.trim()) return NextResponse.json({ error: "Parameter 'nama' wajib diisi" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama, saldo }) }));
}
