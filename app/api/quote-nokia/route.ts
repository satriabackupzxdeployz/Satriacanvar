import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const f = path.join(FONTS, "nokia.ttf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "NokiaFont");
  fl = true;
}

function wrap(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, text: string, maxW: number): string[] {
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
    const body   = await req.json();
    const text   = String(body.text ?? "").trim().slice(0, 200);
    const sender = String(body.sender ?? "Satriadevs").trim().slice(0, 20);
    if (!text) return NextResponse.json({ error: "Parameter 'text' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "nokia", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const AREA   = { x: 93, y: 470, w: 740, h: 450 };
    const cx     = AREA.x + AREA.w / 2;
    let fsz      = 80;
    let lines: string[] = [], lh = 0, th = 0;
    do {
      ctx.font = `${fsz}px NokiaFont`;
      lines    = wrap(ctx, text, AREA.w);
      lh       = fsz + 18;
      th       = lines.length * lh;
      if (th <= AREA.h) break;
      fsz -= 4;
    } while (fsz > 16);

    ctx.font         = `${fsz}px NokiaFont`;
    ctx.fillStyle    = "#1a1a1a";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    const startY     = AREA.y + (AREA.h - th) / 2 + lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh));

    if (sender) {
      ctx.font      = "52px NokiaFont";
      ctx.fillStyle = "#555";
      ctx.fillText(`- ${sender}`, cx, AREA.y + AREA.h + 60);
    }

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"quote-nokia.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  if (!text?.trim()) return NextResponse.json({ error: "Parameter 'text' wajib diisi" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, sender: searchParams.get("sender") }) }));
}
