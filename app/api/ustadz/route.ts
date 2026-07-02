import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

const SCALE  = 1.93;
const AREA   = { x1: Math.round(88*1.93), x2: Math.round(649*1.93), y1: Math.round(109*1.93), y2: Math.round(273*1.93) };

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const f = path.join(FONTS, "Inter-Medium.otf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "InterMedium");
  fontsLoaded = true;
}

function wrapText(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if ((ctx.measureText(test) as { width: number }).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const top  = String(body.top ?? "").trim();
    if (!top) return NextResponse.json({ error: "Parameter 'top' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "ustadz", "bg.png"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    const maxW   = AREA.x2 - AREA.x1;
    const centerX = (AREA.x1 + AREA.x2) / 2 + 25;
    const areaH  = AREA.y2 - AREA.y1;

    let fontSize = 82;
    let lines: string[] = [];
    while (fontSize >= 20) {
      ctx.font = `${fontSize}px InterMedium`;
      lines = wrapText(ctx, top, maxW);
      const lh = fontSize + 15;
      if (lines.length * lh <= areaH) break;
      fontSize -= 4;
    }

    ctx.fillStyle   = "#000000";
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    const lh        = fontSize + 15;
    const totalH    = lines.length * lh;
    const startY    = AREA.y1 + (areaH - totalH) / 2 + lh / 2;
    ctx.font = `${fontSize}px InterMedium`;
    lines.forEach((line, i) => ctx.fillText(line, centerX, startY + i * lh));

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"ustadz.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const top = searchParams.get("top");
  if (!top?.trim()) return NextResponse.json({ error: "Parameter 'top' wajib diisi" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ top }) }));
}
