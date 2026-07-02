import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const bold = path.join(FONTS, "Inter-Bold.otf");
  if (fs.existsSync(bold)) GlobalFonts.registerFromPath(bold, "FWinFont");
  fontsLoaded = true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim().slice(0, 200);
    if (!text) return NextResponse.json({ error: "Parameter 'text' wajib diisi" }, { status: 400 });

    ensureFonts();

    const bgPath = path.join(ASSETS, "fwin", "bg.jpg");
    const bg     = await loadImage(bgPath);
    const W = bg.width, H = bg.height;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, W, H);

    const words = text.trim().split(/\s+/);
    let lines: string[] = [];
    if (words.length <= 5) {
      lines = words;
    } else {
      for (let i = 0; i < words.length; i += 2) {
        lines.push(words.slice(i, i + 2).join(" "));
      }
    }

    const AREA_X = W * 0.09;
    const AREA_Y = H * 0.33;
    const AREA_W = W * 0.33;
    const AREA_H = H * 0.40;

    let fontSize = Math.floor(H * 0.065);
    ctx.fillStyle   = "#000000";
    ctx.textAlign   = "left";
    ctx.textBaseline = "middle";

    while (fontSize > 25) {
      ctx.font = `bold ${fontSize}px FWinFont`;
      const widest = Math.max(...lines.map(v => (ctx.measureText(v) as { width: number }).width));
      if (widest <= AREA_W) break;
      fontSize -= 2;
    }

    ctx.font = `bold ${fontSize}px FWinFont`;
    const lineHeight  = fontSize * 1.18;
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY      = AREA_Y + (AREA_H / 2) - (totalHeight / 2);

    lines.forEach((line, i) => {
      ctx.fillText(line, AREA_X, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer("image/jpeg");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/jpeg",
        "Content-Disposition": "inline; filename=\"fake-windows.jpg\"",
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
  const text = searchParams.get("text");
  if (!text?.trim()) return NextResponse.json({ error: "Parameter 'text' wajib diisi", example: "/api/fake-windows?text=Kenapa+ya+yang+tulus+sering+kalah" }, { status: 400 });
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }));
}
