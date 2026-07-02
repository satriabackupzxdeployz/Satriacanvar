import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "iqcpink");
const FONTS  = path.join(ASSETS, "fonts");

const BG_W = 906;
const BG_H = 1736;
const SX = BG_W / 1080;
const SY = BG_H / 2280;

const CONFIG = {
  bubbleColor:  "#ffc5d5",
  textColor:    "#111111",
  timeColor:    "#5e4146",
  tickColor:    "#8c1d2c",
  fontSize:     Math.round(45 * SX),
  bubbleWidth:  Math.round(746 * SX),
  showReaction: true,
  emojiSize:    Math.round(90 * SX),
  emojiSpacing: Math.round(110 * SX),
  emojiXOffset: Math.round(15 * SX),
  emojiYOffset: -15,
  emojis: ["👍", "😂", "😮", "😢", "🙏"],
  offsetX: 20,
  offsetY: 0,
};

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const reg  = path.join(FONTS, "Inter-Variable.ttf");
  const emj  = path.join(FONTS, "NotoColorEmoji.ttf");
  if (fs.existsSync(reg)) GlobalFonts.registerFromPath(reg, "PinkInter");
  if (fs.existsSync(emj)) GlobalFonts.registerFromPath(emj, "PinkEmoji");
  fontsLoaded = true;
}

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function drawRoundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function measureCustom(ctx: Ctx, text: string, fontSize: number): number {
  const parts = text.split(/(\p{Extended_Pictographic})/gu);
  let total = 0;
  for (const part of parts) {
    if (!part) continue;
    if (/\p{Extended_Pictographic}/u.test(part)) total += fontSize * 1.05;
    else total += (ctx.measureText(part) as { width: number }).width;
  }
  return total;
}

function drawTextWithEmoji(ctx: Ctx, text: string, x: number, y: number, fontSize: number, mainFont: string) {
  const parts = text.split(/(\p{Extended_Pictographic})/gu);
  let cx = x;
  for (const part of parts) {
    if (!part) continue;
    if (/\p{Extended_Pictographic}/u.test(part)) {
      const sz = fontSize * 1.05;
      ctx.save();
      ctx.font = `${sz}px PinkEmoji`;
      ctx.fillText(part, cx, y);
      ctx.restore();
      cx += sz;
    } else {
      ctx.font = `400 ${fontSize}px ${mainFont}`;
      ctx.fillText(part, cx, y);
      cx += (ctx.measureText(part) as { width: number }).width;
    }
  }
}

function wrapText(ctx: Ctx, text: string, maxWidth: number, fontSize: number): string[] {
  ctx.font = `500 ${fontSize}px PinkInter`;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const test = cur + (cur ? " " : "") + word;
    if (measureCustom(ctx, test, fontSize) > maxWidth && i > 0) { lines.push(cur); cur = word; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function loadDefaultAvatar(): Buffer {
  return fs.readFileSync(path.join(ASSETS, "avatar-default.png"));
}

async function render(text: string, time: string, avatarBuf: Buffer): Promise<Buffer> {
  ensureFonts();

  const canvas = createCanvas(BG_W, BG_H);
  const ctx    = canvas.getContext("2d");

  const bg = await loadImage(path.join(ASSETS, "bg.png"));
  ctx.drawImage(bg, 0, 0, BG_W, BG_H);

  const rightPadding   = Math.round(80 * SX);
  const textPaddingX   = Math.round(36 * SX);
  const paddingTop     = Math.round(28 * SY);
  const paddingBottom  = Math.round(28 * SY);
  const bRadius        = Math.round(32 * SX);
  const menuTopBorderY = Math.round(1276 * SY);
  const timeFontSize   = Math.round(23 * SX);

  ctx.font = `600 ${timeFontSize}px PinkInter`;
  const timeMetrics = ctx.measureText(time) as { width: number };
  const ticksWidth  = Math.round(34 * SX);
  const timestampWidth  = timeMetrics.width + ticksWidth + Math.round(12 * SX);
  const timestampHeight = timeFontSize;

  const textLimitW = CONFIG.bubbleWidth - textPaddingX * 2;
  const textLines  = wrapText(ctx, text, textLimitW, CONFIG.fontSize);
  const lineWidths = textLines.map(l => measureCustom(ctx, l, CONFIG.fontSize));
  const maxLineWidth = Math.max(...lineWidths, 0);

  let bubbleActualW = 0;
  let timestampOnNewRow = false;
  const minBubbleW = Math.round(280 * SX);

  if (textLines.length === 1) {
    bubbleActualW = maxLineWidth + textPaddingX * 2 + timestampWidth + Math.round(35 * SX);
  } else {
    const lastLineWidth = lineWidths[textLines.length - 1] || 0;
    if (lastLineWidth + timestampWidth + Math.round(35 * SX) <= maxLineWidth) {
      bubbleActualW = maxLineWidth + textPaddingX * 2;
    } else if (lastLineWidth + timestampWidth + Math.round(35 * SX) <= textLimitW) {
      bubbleActualW = lastLineWidth + timestampWidth + Math.round(35 * SX) + textPaddingX * 2;
    } else {
      bubbleActualW = maxLineWidth + textPaddingX * 2;
      timestampOnNewRow = true;
    }
  }

  if (bubbleActualW < minBubbleW) bubbleActualW = minBubbleW;
  if (bubbleActualW > CONFIG.bubbleWidth) bubbleActualW = CONFIG.bubbleWidth;

  const bubbleX = BG_W - bubbleActualW - rightPadding;
  const lineGap = Math.round(12 * SY);
  const textTotalHeight = textLines.length * CONFIG.fontSize + (textLines.length - 1) * lineGap;

  let bubbleHeight: number;
  if (timestampOnNewRow) bubbleHeight = paddingTop + textTotalHeight + Math.round(16 * SY) + timestampHeight + paddingBottom;
  else bubbleHeight = paddingTop + textTotalHeight + paddingBottom;

  const currentBubbleY = menuTopBorderY - bubbleHeight - Math.round(28 * SY);

  ctx.save();
  ctx.translate(CONFIG.offsetX, CONFIG.offsetY);

  const avatar = await loadImage(avatarBuf);
  const chatPPX = Math.round(75 * SX);
  const chatR   = Math.round(38 * SX);
  ctx.save();
  ctx.beginPath();
  ctx.arc(chatPPX, currentBubbleY + bubbleHeight / 2, chatR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, chatPPX - chatR, currentBubbleY + bubbleHeight / 2 - chatR, chatR * 2, chatR * 2);
  ctx.restore();

  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,0.05)";
  ctx.shadowBlur    = 20;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle     = CONFIG.bubbleColor;
  drawRoundedRect(ctx, bubbleX, currentBubbleY, bubbleActualW, bubbleHeight, bRadius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bubbleX + bubbleActualW - Math.round(15 * SX), currentBubbleY + bubbleHeight - 5);
  ctx.lineTo(bubbleX + bubbleActualW + Math.round(10 * SX), currentBubbleY + bubbleHeight - 5);
  ctx.quadraticCurveTo(
    bubbleX + bubbleActualW + Math.round(2 * SX), currentBubbleY + bubbleHeight - Math.round(20 * SY),
    bubbleX + bubbleActualW - Math.round(1 * SX), currentBubbleY + bubbleHeight - Math.round(32 * SY)
  );
  ctx.closePath();
  ctx.fillStyle = CONFIG.bubbleColor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle    = CONFIG.textColor;
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  for (let i = 0; i < textLines.length; i++) {
    const lineY = currentBubbleY + paddingTop + i * (CONFIG.fontSize + lineGap) + CONFIG.fontSize / 2;
    drawTextWithEmoji(ctx, textLines[i], bubbleX + textPaddingX, lineY, CONFIG.fontSize, "PinkInter");
  }
  ctx.restore();

  ctx.save();
  const timeX = bubbleX + bubbleActualW - textPaddingX - timestampWidth;
  let timeY: number;
  if (timestampOnNewRow) timeY = currentBubbleY + bubbleHeight - paddingBottom - timestampHeight + Math.round(4 * SY);
  else {
    const lastLineTop = currentBubbleY + paddingTop + (textLines.length - 1) * (CONFIG.fontSize + lineGap);
    timeY = lastLineTop + CONFIG.fontSize - timestampHeight + Math.round(2 * SY);
  }
  ctx.fillStyle    = CONFIG.timeColor;
  ctx.font         = `600 ${timeFontSize}px PinkInter`;
  ctx.textBaseline = "top";
  ctx.fillText(time, timeX, timeY);

  const tickX = timeX + timeMetrics.width + Math.round(10 * SX);
  const t = (n: number) => Math.round(n * SX);
  const tickY = timeY + timeFontSize / 2 - t(8);
  ctx.strokeStyle = CONFIG.tickColor;
  ctx.lineWidth   = 3.6 * SX;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(tickX, tickY + t(8));
  ctx.lineTo(tickX + t(6), tickY + t(14));
  ctx.lineTo(tickX + t(16), tickY + t(2));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tickX + t(7), tickY + t(8));
  ctx.lineTo(tickX + t(7) + t(6), tickY + t(14));
  ctx.lineTo(tickX + t(7) + t(16), tickY + t(2));
  ctx.stroke();
  ctx.restore();

  if (CONFIG.showReaction) {
    ctx.save();
    const emojiNum = CONFIG.emojis.length;
    const startPad = Math.round(52 * SX);
    const plusBtnW = Math.round(80 * SX);
    const rxHeight = Math.round(160 * SX);
    const rxWidth  = startPad + (emojiNum - 1) * CONFIG.emojiSpacing + CONFIG.emojiSpacing * 0.5 + plusBtnW + startPad * 0.5;
    const rxX = bubbleX + bubbleActualW - rxWidth + CONFIG.emojiXOffset;
    const rxY = currentBubbleY - rxHeight + CONFIG.emojiYOffset;
    const rxRadius = rxHeight / 2;

    ctx.save();
    ctx.shadowColor   = "rgba(0,0,0,0.10)";
    ctx.shadowBlur    = 36;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle     = "#FFFFFF";
    drawRoundedRect(ctx, rxX, rxY, rxWidth, rxHeight, rxRadius);
    ctx.fill();
    ctx.restore();

    const emojiCY = rxY + rxHeight / 2;
    for (let i = 0; i < emojiNum; i++) {
      ctx.font = `${CONFIG.emojiSize}px PinkEmoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(CONFIG.emojis[i], rxX + startPad + i * CONFIG.emojiSpacing, emojiCY);
    }

    const plusX = rxX + startPad + (emojiNum - 1) * CONFIG.emojiSpacing + Math.round(90 * SX);
    const plusY = emojiCY;
    const plusR = Math.round(38 * SX);
    const arm   = Math.round(13 * SX);
    ctx.beginPath();
    ctx.arc(plusX, plusY, plusR, 0, Math.PI * 2);
    ctx.fillStyle = "#E5E5EA";
    ctx.fill();
    ctx.strokeStyle = "#8E8E93";
    ctx.lineWidth   = 4.5 * SX;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(plusX - arm, plusY); ctx.lineTo(plusX + arm, plusY);
    ctx.moveTo(plusX, plusY - arm); ctx.lineTo(plusX, plusY + arm);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim().slice(0, 200) || "Kesendirian adalah teman terbaik ku";
    const time = String(body.time ?? "").trim().slice(0, 10)  || "00.00";

    const avatarBuf = loadDefaultAvatar();
    const buffer    = await render(text, time, avatarBuf);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": "inline; filename=\"iqc-pink.png\"",
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const time = searchParams.get("time");
  if (!text?.trim()) return NextResponse.json({ error: "Parameter 'text' wajib diisi", example: "/api/iqc-pink?text=Halo+kak&time=22.54" }, { status: 400 });
  try {
    const avatarBuf = loadDefaultAvatar();
    const buffer = await render(text.trim(), (time ?? "00.00").trim(), avatarBuf);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"iqc-pink.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
