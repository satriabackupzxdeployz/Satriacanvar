import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { mkdir, writeFile } from "fs/promises";

const BASE_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main";
const ASSETS_DIR = path.join(process.cwd(), "assets", "pack", "call");
const FONTS_DIR  = path.join(ASSETS_DIR, "fonts");

const BG_URL         = `${BASE_URL}/Image/upscaled_2x%20(1).jpeg`;
const BG_LOCAL        = path.join(ASSETS_DIR, "bg-fakecall.jpg");
const FONT_MEDIUM_URL = `${BASE_URL}/Font/Roboto-Medium.ttf`;
const FONT_LIGHT_URL  = `${BASE_URL}/Font/Roboto-Light.ttf`;
const FONT_MEDIUM_LOCAL = path.join(FONTS_DIR, "Roboto-Medium.ttf");
const FONT_LIGHT_LOCAL  = path.join(FONTS_DIR, "Roboto-Light.ttf");

const CONFIG = {
  avatar:   { x: 0, y: -10, r: 370 },
  name:     { size: 64, x: 0, y: 320 },
  duration: { size: 45, x: 0, y: 30 },
};

let fontsLoaded = false;

async function downloadTo(url: string, dest: string) {
  if (fs.existsSync(dest)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengunduh asset: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function ensureAssets() {
  await mkdir(FONTS_DIR, { recursive: true });
  await Promise.all([
    downloadTo(BG_URL, BG_LOCAL),
    downloadTo(FONT_MEDIUM_URL, FONT_MEDIUM_LOCAL),
    downloadTo(FONT_LIGHT_URL, FONT_LIGHT_LOCAL),
  ]);
  if (!fontsLoaded) {
    GlobalFonts.registerFromPath(FONT_MEDIUM_LOCAL, "CallRobotoMedium");
    GlobalFonts.registerFromPath(FONT_LIGHT_LOCAL, "CallRobotoLight");
    fontsLoaded = true;
  }
}

async function render(name: string, duration: string, avatarBuf: Buffer | string | null): Promise<Buffer> {
  await ensureAssets();

  const bg = await loadImage(BG_LOCAL);
  const W = bg.width;
  const H = bg.height;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  const avatarCX = W / 2 + CONFIG.avatar.x;
  const avatarCY = H / 2 + CONFIG.avatar.y;
  const avatarR  = CONFIG.avatar.r;

  const avatar = avatarBuf
    ? await loadImage(avatarBuf)
    : await loadImage(path.join(process.cwd(), "assets", "iqcpink", "avatar-default.png"));
  {
    const s  = Math.min(avatar.width, avatar.height);
    const sx = (avatar.width - s) / 2;
    const sy = (avatar.height - s) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, sx, sy, s, s, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  }

  const nameX = W / 2 + CONFIG.name.x;
  const nameY = Math.round(avatarCY - avatarR - 250);

  const durX = W / 2 + CONFIG.duration.x;
  const durY = nameY + CONFIG.name.size + CONFIG.duration.y;

  ctx.font         = `${CONFIG.name.size}px CallRobotoMedium`;
  ctx.fillStyle    = "#ffffff";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, nameX, nameY);

  ctx.font         = `${CONFIG.duration.size}px CallRobotoLight`;
  ctx.fillStyle    = "#bdbdbd";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(duration, durX, durY);

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const name     = (form.get("name")     as string | null)?.trim().slice(0, 30) || "Unknown";
    const duration = (form.get("duration") as string | null)?.trim().slice(0, 10) || "00.00";
    const avFile   = form.get("avatar") as File | null;
    const avUrl    = (form.get("avatar_url") as string | null)?.trim() ?? "";

    let avatarBuf: Buffer | string | null = null;
    if (avFile && avFile.size > 0) avatarBuf = Buffer.from(await avFile.arrayBuffer());
    else if (avUrl.startsWith("http")) avatarBuf = avUrl;

    const buffer = await render(name, duration, avatarBuf);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=\"fake-call.png\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const duration = searchParams.get("duration") ?? "00.00";
  const avatarUrl = searchParams.get("avatar_url") ?? "";
  if (!name?.trim()) return NextResponse.json({ error: "Parameter 'name' wajib diisi", example: "/api/fake-call?name=Mama&duration=19.45" }, { status: 400 });
  try {
    const buffer = await render(name.trim(), duration.trim(), avatarUrl.startsWith("http") ? avatarUrl : null);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"fake-call.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
