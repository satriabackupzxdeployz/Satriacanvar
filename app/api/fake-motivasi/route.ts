import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const f = path.join(FONTS, "PatrickHand-Regular.ttf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "QuoteFont");
  fontsLoaded = true;
}

function wrapText(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if ((ctx.measureText(test) as { width: number }).width > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const quote  = String(body.quote  ?? "").trim().slice(0, 300);
    const author = String(body.author ?? "Satriadevs").trim().slice(0, 50);
    if (!quote) return NextResponse.json({ error: "Parameter 'quote' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "motivasi", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    const CENTER_X  = 540;
    const CENTER_Y  = 560;
    const MAX_WIDTH = 650;
    const MAX_HEIGHT = 240;

    let fontSize = 64;
    let lines: string[] = [];

    while (fontSize >= 28) {
      ctx.font = `${fontSize}px QuoteFont`;
      lines    = wrapText(ctx, quote, MAX_WIDTH);
      const lineH   = fontSize * 1.15;
      const totalH  = lines.length * lineH;
      if (totalH <= MAX_HEIGHT) break;
      fontSize -= 2;
    }

    ctx.font         = `${fontSize}px QuoteFont`;
    ctx.fillStyle    = "#733A25";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    const lineHeight  = fontSize * 1.15;
    const totalHeight = lines.length * lineHeight;
    const startY      = CENTER_Y - totalHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], CENTER_X, startY + i * lineHeight);
    }

    ctx.font      = `36px QuoteFont`;
    ctx.fillStyle = "#7F4C1D";
    ctx.textAlign = "center";
    ctx.fillText(`— ${author}`, CENTER_X, 935);

    const buffer = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": "inline; filename=\"fake-motivasi.png\"",
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
  const quote  = searchParams.get("quote");
  const author = searchParams.get("author");
  if (!quote?.trim()) return NextResponse.json({ error: "Parameter 'quote' wajib diisi", example: "/api/fake-motivasi?quote=Hidup+itu+keras&author=Satriadevs" }, { status: 400 });
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote, author }),
  }));
}
