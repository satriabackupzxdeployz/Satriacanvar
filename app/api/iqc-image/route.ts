import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "iqc");
const FONTS  = path.join(ASSETS, "fonts");

const WA_COLORS = [
  "#E53935","#D81B60","#8E24AA","#5E35B1",
  "#1E88E5","#039BE5","#00897B","#43A047",
  "#F4511E","#FB8C00",
];

let colorIdx = 0;
function getNextColor() {
  const c = WA_COLORS[colorIdx % WA_COLORS.length];
  colorIdx = (colorIdx + 1) % WA_COLORS.length;
  return c;
}

const CONFIG = {
  canvas: { width: 1920, height: 3413 },
  safeZones: {
    namaAtas:  { a: 980,  b: 1080, c: 250, d: 630,  fontSize: 55, maxChars: 25, font: "SFProSemiBold", align: "left" },
    foto:      { a: 1125, b: 1713, c: 240, d: 830,  radius: 28 },
    waktu:     { a: 1750, b: 1860, c: 233, d: 424,  fontSize: 45, maxChars: 10, font: "SFProRegular",  textColor: "#555555", align: "center" },
    namaBawah: { a: 2701, b: 2880, c: 700, d: 1160, centerY: 2787, fontSize: 67, maxChars: 25, font: "SFProSemiBold", textColor: "#100e0e", align: "left" },
  },
};

let fontsLoaded = false;
function loadFonts() {
  if (fontsLoaded) return;
  const semi = path.join(FONTS, "SFPRODISPLAYSEMIBOLD.ttf");
  const reg  = path.join(FONTS, "SFPRODISPLAYREGULAR.OTF");
  if (fs.existsSync(semi)) GlobalFonts.registerFromPath(semi, "SFProSemiBold");
  if (fs.existsSync(reg))  GlobalFonts.registerFromPath(reg,  "SFProRegular");
  fontsLoaded = true;
}

function roundedClip(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, x: number, y: number, w: number, h: number, r: number) {
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

function drawText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  zone: { a: number; b: number; c: number; d: number; fontSize: number; maxChars: number; font: string; align: string; centerY?: number },
  textColor: string
) {
  const { a, b, c, d, fontSize, maxChars, font, align, centerY } = zone;
  const str  = String(text).slice(0, maxChars);
  const boxW = d - c;
  const boxH = b - a;
  const cy   = centerY !== undefined ? centerY : a + boxH / 2;
  let size   = fontSize;
  ctx.textBaseline = "middle";
  while (size > 12) {
    ctx.font = `${size}px ${font}`;
    if ((ctx.measureText(str) as { width: number }).width <= boxW) break;
    size -= 1;
  }
  ctx.font        = `${size}px ${font}`;
  ctx.fillStyle   = textColor;
  ctx.shadowColor = "transparent";
  if (align === "center") {
    ctx.textAlign = "center";
    ctx.fillText(str, c + boxW / 2, cy);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(str, c, cy);
  }
}

async function drawFoto(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  imgBuffer: Buffer,
  zone: { a: number; b: number; c: number; d: number; radius: number }
) {
  const { a, b, c, d, radius } = zone;
  const x = c, y = a, w = d - c, h = b - a, r = radius;
  const img      = await loadImage(imgBuffer);
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  ctx.save();
  roundedClip(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.filter = "blur(28px)";
  ctx.drawImage(img, x - 40, y - 40, w + 80, h + 80);
  ctx.filter = "none";
  let fw: number, fh: number;
  if (imgRatio > boxRatio) { fw = w; fh = fw / imgRatio; }
  else { fh = h; fw = fh * imgRatio; }
  ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
  ctx.restore();
}

async function processRequest(nama: string, waktu: string, photoBuffer: Buffer | null): Promise<Buffer> {
  loadFonts();
  const namaColor = getNextColor();
  const { width, height } = CONFIG.canvas;
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");
  const bgPath = path.join(ASSETS, "bg", "bg.jpg");
  if (fs.existsSync(bgPath)) {
    const bgImg = await loadImage(bgPath);
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#f0ece4";
    ctx.fillRect(0, 0, width, height);
  }
  if (photoBuffer) await drawFoto(ctx, photoBuffer, CONFIG.safeZones.foto);
  drawText(ctx, nama,  CONFIG.safeZones.namaAtas,  namaColor);
  drawText(ctx, waktu, CONFIG.safeZones.waktu,      CONFIG.safeZones.waktu.textColor);
  drawText(ctx, nama,  CONFIG.safeZones.namaBawah,  CONFIG.safeZones.namaBawah.textColor);
  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const nama      = (formData.get("nama")      as string | null)?.trim().slice(0, 25);
    const waktu     = (formData.get("waktu")     as string | null)?.trim().slice(0, 10);
    const photoFile = formData.get("photo")      as File   | null;
    const photoUrl  = (formData.get("photo_url") as string | null)?.trim() ?? "";

    if (!nama)  return NextResponse.json({ error: "Parameter 'nama' wajib diisi"  }, { status: 400 });
    if (!waktu) return NextResponse.json({ error: "Parameter 'waktu' wajib diisi" }, { status: 400 });

    let photoBuffer: Buffer | null = null;
    if (photoFile && photoFile.size > 0) {
      photoBuffer = Buffer.from(await photoFile.arrayBuffer());
    } else if (photoUrl.startsWith("http")) {
      try { photoBuffer = Buffer.from(await (await fetch(photoUrl)).arrayBuffer()); } catch {}
    }

    const buffer = await processRequest(nama, waktu, photoBuffer);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": `inline; filename="iqc-image-${nama}.png"`,
        "Cache-Control":       "no-store",
        "X-Nama":              nama,
        "X-Waktu":             waktu,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nama     = searchParams.get("nama");
  const waktu    = searchParams.get("waktu");
  const photoUrl = searchParams.get("photo_url") ?? "";

  if (!nama?.trim())  return NextResponse.json({ error: "Parameter 'nama' wajib diisi",  example: "/iqc-image?nama=Satriadevs&waktu=13.56" }, { status: 400 });
  if (!waktu?.trim()) return NextResponse.json({ error: "Parameter 'waktu' wajib diisi" }, { status: 400 });

  let photoBuffer: Buffer | null = null;
  if (photoUrl.startsWith("http")) {
    try { photoBuffer = Buffer.from(await (await fetch(photoUrl)).arrayBuffer()); } catch {}
  }

  try {
    const buffer = await processRequest(nama.trim(), waktu.trim(), photoBuffer);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": `inline; filename="iqc-image-${nama.trim()}.png"`,
        "Cache-Control":       "no-store",
        "X-Nama":              nama.trim(),
        "X-Waktu":             waktu.trim(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
