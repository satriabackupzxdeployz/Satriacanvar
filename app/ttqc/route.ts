import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "ttqc");
const FONTS  = path.join(ASSETS, "fonts");

const CONFIG = {
  topPPX: 183, topPPY: 83, topPPRadius: 42,
  topNameX: 250, topNameY: 82, topNameSize: 34,
  chatPPX: 75, chatPPRadius: 38,
  textX: 175, textY: 962,
  bubbleWidth: 520, textSize: 30,
  bubbleBgColor: "#ffffff", textColor: "#161823",
};

const MENU_ICONS = [
  { unicode: "\uf3e5", text: "Balas",           color: "#000000" },
  { unicode: "\uf064", text: "Teruskan",         color: "#000000" },
  { unicode: "\uf0c5", text: "Salin",            color: "#000000" },
  { unicode: "\uf1ab", text: "Terjemahkan",      color: "#000000" },
  { unicode: "\uf2ed", text: "Hapus untuk saya", color: "#000000" },
  { unicode: "\uf024", text: "Laporkan",         color: "#ea4335" },
];

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const reg  = path.join(FONTS, "PlusJakartaSans-Regular.ttf");
  const med  = path.join(FONTS, "PlusJakartaSans-Medium.ttf");
  const bold = path.join(FONTS, "PlusJakartaSans-Bold.ttf");
  const fa   = path.join(FONTS, "fa-solid-900.ttf");
  const emj  = path.join(FONTS, "NotoColorEmoji.ttf");
  if (fs.existsSync(reg))  GlobalFonts.registerFromPath(reg,  "TTJakarta");
  if (fs.existsSync(med))  GlobalFonts.registerFromPath(med,  "TTJakarta");
  if (fs.existsSync(bold)) GlobalFonts.registerFromPath(bold, "TTJakarta");
  if (fs.existsSync(fa))   GlobalFonts.registerFromPath(fa,   "TTAwesome");
  if (fs.existsSync(emj))  GlobalFonts.registerFromPath(emj,  "TTEmoji");
  fontsLoaded = true;
}

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(/(\s+)/);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if (!word) continue;
    if (word.trim() === "" && currentLine === "") continue;
    const testLine = currentLine + word;
    if ((ctx.measureText(testLine) as { width: number }).width > maxWidth) {
      if (currentLine !== "") { lines.push(currentLine.trimEnd()); currentLine = word.trimStart(); }
      else { lines.push(testLine); currentLine = ""; }
    } else currentLine = testLine;
  }
  if (currentLine.trim()) lines.push(currentLine.trimEnd());
  return lines;
}

function drawRoundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string | null = null, shadow = false) {
  ctx.save();
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.05)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; }
  ctx.fillStyle = fill;
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
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.restore();
}

function drawCircleImage(ctx: Ctx, img: Awaited<ReturnType<typeof loadImage>>, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

async function loadAvatarSmart(file: File | null, url: string): Promise<Buffer> {
  if (file && file.size > 0) return Buffer.from(await file.arrayBuffer());
  if (url && url.startsWith("http")) {
    try { return Buffer.from(await (await fetch(url)).arrayBuffer()); } catch {}
  }
  return fs.readFileSync(path.join(ASSETS, "avatar-default.jpg"));
}

async function render(username: string, chatText: string, avatarBuf: Buffer): Promise<Buffer> {
  ensureFonts();

  const templateImage = await loadImage(path.join(ASSETS, "template.png"));
  const avatarImage   = await loadImage(avatarBuf);

  const canvas = createCanvas(1080 * 2, 2280 * 2);
  const ctx    = canvas.getContext("2d");

  ctx.scale(2, 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.clearRect(0, 0, 1080, 2280);
  ctx.drawImage(templateImage, 0, 0, 1080, 2280);

  drawCircleImage(ctx, avatarImage, CONFIG.topPPX, CONFIG.topPPY, CONFIG.topPPRadius);

  ctx.font = `bold ${CONFIG.topNameSize}px TTJakarta, TTEmoji`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(username, CONFIG.topNameX, CONFIG.topNameY);

  ctx.font = `500 ${CONFIG.textSize}px TTJakarta, TTEmoji`;
  const lines = wrapText(ctx, chatText, CONFIG.bubbleWidth - 52);
  const lineH = CONFIG.textSize * 1.45;

  let maxW = 0;
  for (const l of lines) {
    const w = (ctx.measureText(l) as { width: number }).width;
    if (w > maxW) maxW = w;
  }

  const padX = 30, padY = 24;
  const bubbleW = Math.max(maxW + padX * 2, 180);
  const bubbleH = lines.length * lineH + padY * 2;
  const bubbleX = CONFIG.textX - padX;
  const bubbleY = CONFIG.textY - padY;

  drawCircleImage(ctx, avatarImage, CONFIG.chatPPX, bubbleY + bubbleH / 2, CONFIG.chatPPRadius);
  drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 35, CONFIG.bubbleBgColor);

  ctx.fillStyle = CONFIG.textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const lineY = CONFIG.textY + i * lineH + CONFIG.textSize / 2;
    ctx.fillText(line, CONFIG.textX, lineY);
  });

  const menuX = 90, menuY = bubbleY + bubbleH + 28;
  drawRoundedRect(ctx, menuX, menuY, 565, 580, 40, "#ffffff", "rgba(0,0,0,0.02)", true);

  const itemH = 90, iconX = menuX + 60, labelX = menuX + 130;
  MENU_ICONS.forEach((item, i) => {
    const cy = menuY + 25 + i * itemH + itemH / 2;
    ctx.fillStyle = item.color;
    ctx.font = `900 34px TTAwesome`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.unicode, iconX, cy);
    ctx.font = `500 34px TTJakarta`;
    ctx.textAlign = "left";
    ctx.fillText(item.text, labelX, cy);
  });

  ctx.restore();

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const username = (form.get("username") as string | null)?.trim().slice(0, 30) || "Satriadevs";
    const chatText = (form.get("text") as string | null)?.trim().slice(0, 150)     || "Just friend kok cemburu";
    const avFile   = form.get("avatar") as File | null;
    const avUrl    = (form.get("avatar_url") as string | null)?.trim() ?? "";

    const avatarBuf = await loadAvatarSmart(avFile, avUrl);
    const buffer    = await render(username, chatText, avatarBuf);

    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"ttqc.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "Satriadevs";
  const text     = searchParams.get("text");
  const avatarUrl = searchParams.get("avatar_url") ?? "";
  if (!text?.trim()) return NextResponse.json({ error: "Parameter 'text' wajib diisi", example: "/ttqc?username=Satriadevs&text=Halo+kak" }, { status: 400 });
  try {
    const avatarBuf = await loadAvatarSmart(null, avatarUrl);
    const buffer = await render(username.trim(), text.trim(), avatarBuf);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"ttqc.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
