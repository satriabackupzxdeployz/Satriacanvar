import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const FONTS = path.join(process.cwd(), "assets", "pack", "fonts");
let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const imp = path.join(FONTS, "impact.ttf");
  if (fs.existsSync(imp)) GlobalFonts.registerFromPath(imp, "ImpactMeme");
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
    const form       = await req.formData();
    const top        = (form.get("top")    as string | null)?.trim() ?? "";
    const bottom     = (form.get("bottom") as string | null)?.trim() ?? "";
    const file       = form.get("image")   as File | null;
    const imageUrl   = (form.get("image_url") as string | null)?.trim() ?? "";
    const fontSizeIn = Number(form.get("fontsize") ?? 80);
    const strokeIn   = Number(form.get("stroke")   ?? 5);

    if (!top && !bottom) return NextResponse.json({ error: "Isi teks atas atau bawah" }, { status: 400 });
    if ((!file || file.size === 0) && !imageUrl.startsWith("http")) return NextResponse.json({ error: "Upload gambar atau isi image_url" }, { status: 400 });

    ensureFonts();
    const img = file && file.size > 0 ? await loadImage(Buffer.from(await file.arrayBuffer())) : await loadImage(imageUrl);

    const MAX_W  = 1000;
    const ratio  = Math.min(MAX_W / img.width, 1);
    const W      = Math.round(img.width * ratio);
    const H      = Math.round(img.height * ratio);

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);

    const fontSize   = (fontSizeIn || 80) * ratio;
    const strokeSize = (strokeIn   || 5)  * ratio;

    ctx.font      = `${fontSize}px ImpactMeme, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineJoin  = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = strokeSize;

    if (top) {
      const topLines = wrapText(ctx, top.toUpperCase(), W - fontSize * 0.4);
      const lh = fontSize * 1.1;
      topLines.forEach((line, i) => {
        const y = fontSize * 1.05 + i * lh;
        ctx.strokeStyle = "#000"; ctx.textBaseline = "top";
        ctx.strokeText(line, W / 2, y - fontSize);
        ctx.fillStyle = "#fff";
        ctx.fillText(line, W / 2, y - fontSize);
      });
    }

    if (bottom) {
      const botLines = wrapText(ctx, bottom.toUpperCase(), W - fontSize * 0.4);
      const lh = fontSize * 1.1;
      const totalH = botLines.length * lh;
      botLines.forEach((line, i) => {
        const y = H - totalH + i * lh;
        ctx.strokeStyle = "#000"; ctx.textBaseline = "bottom";
        ctx.strokeText(line, W / 2, y);
        ctx.fillStyle = "#fff";
        ctx.fillText(line, W / 2, y);
      });
    }

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"smeme.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
