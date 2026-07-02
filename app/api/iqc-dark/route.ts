import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack", "iqc-dark");
const FONTS  = path.join(process.cwd(), "assets", "iqcpink", "fonts");
const BG_W   = 941;
const BG_H   = 1672;

const EMOJIS      = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu;

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const reg = path.join(FONTS, "Inter-Variable.ttf");
  const emj = path.join(FONTS, "NotoColorEmoji.ttf");
  if (fs.existsSync(reg)) GlobalFonts.registerFromPath(reg, "DarkInter");
  if (fs.existsSync(emj)) GlobalFonts.registerFromPath(emj, "DarkEmoji");
  fontsLoaded = true;
}

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function measureCustom(ctx: Ctx, text: string, fontSize: number): number {
  const parts = text.split(EMOJI_REGEX);
  let total = 0;
  for (const part of parts) {
    if (!part) continue;
    EMOJI_REGEX.lastIndex = 0;
    total += EMOJI_REGEX.test(part) ? fontSize * 1.05 : (ctx.measureText(part) as { width: number }).width;
    EMOJI_REGEX.lastIndex = 0;
  }
  return total;
}

async function drawTextWithEmojis(ctx: Ctx, text: string, x: number, y: number, fontSize: number) {
  const parts = text.split(EMOJI_REGEX);
  let cx = x;
  for (const part of parts) {
    if (!part) continue;
    EMOJI_REGEX.lastIndex = 0;
    if (EMOJI_REGEX.test(part)) {
      const sz = fontSize * 1.05;
      ctx.save();
      ctx.font = `${sz}px DarkEmoji`;
      ctx.fillText(part, cx, y);
      ctx.restore();
      cx += sz;
    } else {
      ctx.fillText(part, cx, y);
      cx += (ctx.measureText(part) as { width: number }).width;
    }
    EMOJI_REGEX.lastIndex = 0;
  }
}

function wrapText(ctx: Ctx, text: string, maxWidth: number, fontSize: number): string[] {
  ctx.font = `${fontSize}px DarkInter`;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if (word.includes("\n")) {
      const parts = word.split("\n");
      for (let j = 0; j < parts.length; j++) {
        const test = cur + (cur ? " " : "") + parts[j];
        if (measureCustom(ctx, test, fontSize) > maxWidth && cur) { lines.push(cur); cur = parts[j]; }
        else cur = test;
        if (j < parts.length - 1) { lines.push(cur); cur = ""; }
      }
      continue;
    }
    const test = cur + (cur ? " " : "") + word;
    if (measureCustom(ctx, test, fontSize) > maxWidth && cur) { lines.push(cur); cur = word; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

async function render(time: string, text: string, imgBuf: Buffer | null): Promise<Buffer> {
  ensureFonts();

  const bgImg = await loadImage(path.join(ASSETS, "bg.png"));
  const canvas = createCanvas(BG_W, BG_H);
  const ctx    = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, BG_W, BG_H);

  const PERMANENT_TIME_X    = 463;
  const PERMANENT_TIME_Y    = 8;
  const PERMANENT_TIME_SIZE = 27;
  ctx.fillStyle    = "#ffffff";
  ctx.font         = `${PERMANENT_TIME_SIZE}px DarkInter`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.fillText(time, PERMANENT_TIME_X, PERMANENT_TIME_Y);

  const chatFontSize   = 30;
  const maxWidthLimit  = 530;
  const lineHeight     = chatFontSize + 14;
  const paddingX       = 30;
  const paddingY       = 20;
  const rad            = 28;
  const fixedX         = 35;
  const fixedBaseY     = 946;

  ctx.font = "22px DarkInter";
  const timeWidth = (ctx.measureText(time) as { width: number }).width;

  let finalY: number, finalBubbleHeight: number, bubbleW: number;

  if (!imgBuf) {
    if (!text) return canvas.toBuffer("image/png");

    ctx.font = `${chatFontSize}px DarkInter`;
    const chatLines = wrapText(ctx, text, maxWidthLimit, chatFontSize);

    let longestW = 0;
    for (const l of chatLines) {
      const w = measureCustom(ctx, l.trim(), chatFontSize);
      if (w > longestW) longestW = w;
    }
    bubbleW = Math.max(longestW + paddingX * 2, timeWidth + 75, 180);
    finalBubbleHeight = chatLines.length * lineHeight + paddingY + 12 + 22;
    finalY = fixedBaseY - finalBubbleHeight;

    ctx.fillStyle = "#1c1c1e";
    ctx.beginPath();
    ctx.moveTo(fixedX + rad, finalY);
    ctx.lineTo(fixedX + bubbleW - rad, finalY);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
    ctx.lineTo(fixedX + bubbleW, finalY + finalBubbleHeight - rad);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY + finalBubbleHeight, fixedX + bubbleW - rad, finalY + finalBubbleHeight);
    ctx.lineTo(fixedX + rad, finalY + finalBubbleHeight);
    ctx.quadraticCurveTo(fixedX + 8, finalY + finalBubbleHeight, fixedX + 8, finalY + finalBubbleHeight - 8);
    ctx.lineTo(fixedX + 8, finalY + rad);
    ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fixedX + 12, finalY + finalBubbleHeight - 20);
    ctx.quadraticCurveTo(fixedX - 2, finalY + finalBubbleHeight - 4, fixedX - 8, finalY + finalBubbleHeight);
    ctx.quadraticCurveTo(fixedX + 6, finalY + finalBubbleHeight, fixedX + 22, finalY + finalBubbleHeight - 2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.fillStyle    = "#ffffff";
    ctx.font         = `${chatFontSize}px DarkInter`;
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < chatLines.length; i++) {
      const lineY = finalY + paddingY + i * lineHeight + chatFontSize / 2;
      await drawTextWithEmojis(ctx, chatLines[i].trim(), fixedX + paddingX, lineY, chatFontSize);
    }
    ctx.restore();

    ctx.fillStyle    = "#727278";
    ctx.font         = "22px DarkInter";
    ctx.textAlign    = "right";
    ctx.textBaseline = "top";
    ctx.fillText(time, fixedX + bubbleW - 22, finalY + finalBubbleHeight - 38);

  } else {
    const imgObj    = await loadImage(imgBuf);
    const imgAspect = imgObj.width / imgObj.height;
    bubbleW = Math.min(Math.max(imgObj.width, 280), maxWidthLimit);
    let imgDrawH = Math.round(bubbleW / imgAspect);
    bubbleW = Math.max(bubbleW, timeWidth + 75);

    let captionLines: string[] = [];
    if (text) {
      ctx.font    = `${chatFontSize}px DarkInter`;
      captionLines = wrapText(ctx, text, bubbleW - paddingX * 2, chatFontSize);
    }

    const captionH        = captionLines.length > 0 ? paddingY + captionLines.length * lineHeight : 0;
    const timeRowH        = 28;
    finalBubbleHeight     = imgDrawH + captionH + timeRowH + (captionLines.length > 0 ? 4 : 0);
    finalY                = fixedBaseY - finalBubbleHeight;

    ctx.fillStyle = "#1c1c1e";
    ctx.beginPath();
    ctx.moveTo(fixedX + rad, finalY);
    ctx.lineTo(fixedX + bubbleW - rad, finalY);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
    ctx.lineTo(fixedX + bubbleW, finalY + finalBubbleHeight - rad);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY + finalBubbleHeight, fixedX + bubbleW - rad, finalY + finalBubbleHeight);
    ctx.lineTo(fixedX + rad, finalY + finalBubbleHeight);
    ctx.quadraticCurveTo(fixedX + 8, finalY + finalBubbleHeight, fixedX + 8, finalY + finalBubbleHeight - 8);
    ctx.lineTo(fixedX + 8, finalY + rad);
    ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fixedX + 12, finalY + finalBubbleHeight - 20);
    ctx.quadraticCurveTo(fixedX - 2, finalY + finalBubbleHeight - 4, fixedX - 8, finalY + finalBubbleHeight);
    ctx.quadraticCurveTo(fixedX + 6, finalY + finalBubbleHeight, fixedX + 22, finalY + finalBubbleHeight - 2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fixedX + rad, finalY);
    ctx.lineTo(fixedX + bubbleW - rad, finalY);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
    ctx.lineTo(fixedX + bubbleW, finalY + imgDrawH);
    ctx.lineTo(fixedX + 8, finalY + imgDrawH);
    ctx.lineTo(fixedX + 8, finalY + rad);
    ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(imgObj, fixedX, finalY, bubbleW, imgDrawH);
    ctx.beginPath();
    ctx.moveTo(fixedX + 8, finalY + imgDrawH);
    ctx.lineTo(fixedX + 8, finalY + rad);
    ctx.quadraticCurveTo(fixedX + 8, finalY, fixedX + rad, finalY);
    ctx.lineTo(fixedX + bubbleW - rad, finalY);
    ctx.quadraticCurveTo(fixedX + bubbleW, finalY, fixedX + bubbleW, finalY + rad);
    ctx.lineTo(fixedX + bubbleW, finalY + imgDrawH);
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth   = 18;
    ctx.stroke();
    ctx.restore();

    if (captionLines.length > 0) {
      ctx.save();
      ctx.fillStyle    = "#ffffff";
      ctx.font         = `${chatFontSize}px DarkInter`;
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      for (let i = 0; i < captionLines.length; i++) {
        const lineY = finalY + imgDrawH + paddingY + i * lineHeight + chatFontSize / 2;
        await drawTextWithEmojis(ctx, captionLines[i].trim(), fixedX + paddingX, lineY, chatFontSize);
      }
      ctx.restore();
    }

    ctx.fillStyle    = "#727278";
    ctx.font         = "22px DarkInter";
    ctx.textAlign    = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(time, fixedX + bubbleW - 22, finalY + finalBubbleHeight - timeRowH);
  }

  const emojiSize  = 56;
  const emCardH    = emojiSize + 44;
  const emCardW    = 530;
  const emCardX    = fixedX + 8;
  const emCardY    = finalY - emCardH - 18;

  ctx.fillStyle = "#1c1c1e";
  ctx.beginPath();
  (ctx as unknown as { roundRect(x:number,y:number,w:number,h:number,r:number[]): void })
    .roundRect(emCardX, emCardY, emCardW, emCardH, [emCardH / 2]);
  ctx.fill();

  const startX   = emCardX + 55;
  const spacingX = 76;
  const emojiCY  = emCardY + emCardH / 2 + 2;

  ctx.font         = `${emojiSize}px DarkEmoji`;
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  for (let i = 0; i < Math.min(EMOJIS.length, 6); i++) {
    ctx.fillText(EMOJIS[i], startX + i * spacingX, emojiCY);
  }

  ctx.fillStyle    = "#8e8e93";
  ctx.font         = "36px DarkInter";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", startX + 6 * spacingX - 8, emCardY + emCardH / 2 - 2);

  return canvas.toBuffer("image/png");
}

async function resolveImage(file: File | null, url: string): Promise<Buffer | null> {
  if (file && file.size > 0) return Buffer.from(await file.arrayBuffer());
  if (url && url.startsWith("http")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal mengunduh gambar: ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData();
    const time    = (form.get("time")      as string | null)?.trim().slice(0, 10) || "00.00";
    const text    = (form.get("text")      as string | null)?.trim().slice(0, 500) || "";
    const imgFile = form.get("image")      as File | null;
    const imgUrl  = (form.get("image_url") as string | null)?.trim() ?? "";

    if (!text && !imgFile && !imgUrl) {
      return NextResponse.json({ error: "Isi 'text' dan/atau 'image'/'image_url'" }, { status: 400 });
    }

    const imgBuf = await resolveImage(imgFile, imgUrl);
    const buf    = await render(time, text, imgBuf);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"iqc-dark.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const time    = searchParams.get("time")      ?? "00.00";
  const text    = searchParams.get("text")      ?? "";
  const imgUrl  = searchParams.get("image_url") ?? "";

  if (!text && !imgUrl) {
    return NextResponse.json({ error: "Isi 'text' dan/atau 'image_url'" }, { status: 400 });
  }
  try {
    const imgBuf = await resolveImage(null, imgUrl);
    const buf    = await render(time.trim(), text.trim(), imgBuf);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"iqc-dark.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
