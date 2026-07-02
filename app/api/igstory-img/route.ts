import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack", "igstory-img");
const BG_W = 898;
const BG_H = 1600;

const FOTO_ZONE = { a: 136, b: 912, c: 38, d: 860, radius: 20 };
const PP_CFG    = { x: 110, y: 82, size: 80 };
const NAMA_CFG  = { x: 170, y: 58,  fontSize: 25, maxWidth: 500, minFontSize: 16, color: "#feffff" };
const USER_CFG  = { x: 170, y: 90,  fontSize: 17, color: "#8c8d91" };
const EDGE_BLUR = { width: 3, blur: 10 };

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const sb = path.join(ASSETS, "Inter-SemiBold.woff2");
  const rg = path.join(ASSETS, "Inter-Regular.woff2");
  if (fs.existsSync(sb)) GlobalFonts.registerFromPath(sb, "IGImgSemiBold");
  if (fs.existsSync(rg)) GlobalFonts.registerFromPath(rg, "IGImgRegular");
  fontsLoaded = true;
}

async function resolveImage(file: File | null, url: string) {
  if (file && file.size > 0) return loadImage(Buffer.from(await file.arrayBuffer()));
  if (url && url.startsWith("http")) return loadImage(url);
  return null;
}

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function roundedBottomClipPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y);
  ctx.closePath();
}

function roundedBottomOuterPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, bw: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.rect(x - bw, y, bw, h - radius);
  ctx.rect(x + w, y, bw, h - radius);
  ctx.moveTo(x - bw, y + h - radius);
  ctx.lineTo(x, y + h - radius);
  ctx.quadraticCurveTo(x, y + h, x + radius, y + h);
  ctx.lineTo(x + radius, y + h + bw);
  ctx.quadraticCurveTo(x - bw, y + h + bw, x - bw, y + h - radius);
  ctx.closePath();
  ctx.moveTo(x + w + bw, y + h - radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + w - radius, y + h + bw);
  ctx.quadraticCurveTo(x + w + bw, y + h + bw, x + w + bw, y + h - radius);
  ctx.closePath();
  ctx.rect(x + radius, y + h, w - radius * 2, bw);
}

function getContainSize(iw: number, ih: number, bw: number, bh: number) {
  const ir = iw / ih, br = bw / bh;
  return ir > br ? { fw: bw, fh: bw / ir } : { fw: bh * ir, fh: bh };
}

function getCoverSize(iw: number, ih: number, bw: number, bh: number) {
  const ir = iw / ih, br = bw / bh;
  return ir > br ? { fw: bh * ir, fh: bh } : { fw: bw, fh: bw / ir };
}

function drawFoto(ctx: Ctx, img: Awaited<ReturnType<typeof loadImage>>, zone: typeof FOTO_ZONE) {
  const x = zone.c, y = zone.a, w = zone.d - zone.c, h = zone.b - zone.a;
  ctx.save();
  roundedBottomClipPath(ctx, x, y, w, h, zone.radius);
  ctx.clip();
  ctx.filter = "blur(28px)";
  ctx.drawImage(img, x - 40, y - 40, w + 80, h + 80);
  ctx.filter = "none";
  const { fw, fh } = getContainSize(img.width, img.height, w, h);
  ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
  ctx.restore();
}

function drawEdgeBlur(ctx: Ctx, img: Awaited<ReturnType<typeof loadImage>>, zone: typeof FOTO_ZONE, eb: typeof EDGE_BLUR) {
  const x = zone.c, y = zone.a, w = zone.d - zone.c, h = zone.b - zone.a;
  const { fw, fh } = getCoverSize(img.width, img.height, w, h);
  const ix = x + (w - fw) / 2, iy = y + (h - fh) / 2;
  ctx.save();
  roundedBottomOuterPath(ctx, x, y, w, h, zone.radius, eb.width);
  ctx.clip();
  ctx.filter = `blur(${eb.blur}px)`;
  ctx.drawImage(img, ix, iy, fw, fh);
  ctx.filter = "none";
  ctx.restore();
}

function drawPP(ctx: Ctx, img: Awaited<ReturnType<typeof loadImage>>, pp: typeof PP_CFG) {
  const r = pp.size / 2;
  const dim = Math.min(img.width, img.height);
  const sx = (img.width - dim) / 2, sy = (img.height - dim) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, dim, dim, pp.x - r, pp.y - r, pp.size, pp.size);
  ctx.restore();
}

function drawNama(ctx: Ctx, text: string) {
  let size = NAMA_CFG.fontSize;
  while (size > NAMA_CFG.minFontSize) {
    ctx.font = `${size}px IGImgSemiBold`;
    if ((ctx.measureText(text) as { width: number }).width <= NAMA_CFG.maxWidth) break;
    size--;
  }
  ctx.save();
  ctx.font = `${size}px IGImgSemiBold`;
  ctx.fillStyle = NAMA_CFG.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, NAMA_CFG.x, NAMA_CFG.y);
  ctx.restore();
}

function drawUsername(ctx: Ctx, text: string) {
  ctx.save();
  ctx.font = `${USER_CFG.fontSize}px IGImgRegular`;
  ctx.fillStyle = USER_CFG.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, USER_CFG.x, USER_CFG.y);
  ctx.restore();
}

async function render(
  nama: string,
  username: string,
  fotoImg: Awaited<ReturnType<typeof loadImage>> | null,
  ppImg: Awaited<ReturnType<typeof loadImage>> | null
): Promise<Buffer> {
  ensureFonts();
  const bg = await loadImage(path.join(ASSETS, "igimg.png"));
  const canvas = createCanvas(BG_W, BG_H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0, BG_W, BG_H);

  if (fotoImg) {
    drawFoto(ctx, fotoImg, FOTO_ZONE);
    drawEdgeBlur(ctx, fotoImg, FOTO_ZONE, EDGE_BLUR);
  }

  if (ppImg) drawPP(ctx, ppImg, PP_CFG);

  if (nama)     drawNama(ctx, nama);
  if (username) drawUsername(ctx, username.startsWith("@") ? username : `@${username}`);

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const nama     = (form.get("nama")     as string | null)?.trim().slice(0, 40) || "Someone";
    const username = (form.get("username") as string | null)?.trim().slice(0, 30) || "someone";
    const fotoFile = form.get("foto")     as File | null;
    const fotoUrl  = (form.get("foto_url")  as string | null)?.trim() ?? "";
    const ppFile   = form.get("pp")       as File | null;
    const ppUrl    = (form.get("pp_url")    as string | null)?.trim() ?? "";

    const [fotoImg, ppImg] = await Promise.all([
      resolveImage(fotoFile, fotoUrl),
      resolveImage(ppFile, ppUrl),
    ]);

    const buf = await render(nama, username, fotoImg, ppImg);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"igstory-img.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nama     = searchParams.get("nama")     ?? "Someone";
  const username = searchParams.get("username") ?? "someone";
  const fotoUrl  = searchParams.get("foto_url") ?? "";
  const ppUrl    = searchParams.get("pp_url")   ?? "";

  try {
    const [fotoImg, ppImg] = await Promise.all([
      fotoUrl.startsWith("http") ? loadImage(fotoUrl) : Promise.resolve(null),
      ppUrl.startsWith("http")   ? loadImage(ppUrl)   : Promise.resolve(null),
    ]);
    const buf = await render(nama.trim(), username.trim(), fotoImg, ppImg);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"igstory-img.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
