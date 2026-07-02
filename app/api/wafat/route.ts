import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const f = path.join(FONTS, "SFPRODISPLAYSEMIBOLD.ttf");
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, "WafatFont");
  fl = true;
}

async function loadFotoSmart(file: File | null, url: string) {
  if (file && file.size > 0) return loadImage(Buffer.from(await file.arrayBuffer()));
  if (url && url.startsWith("http")) return loadImage(url);
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData();
    const nama    = (form.get("nama")    as string | null)?.trim().slice(0, 40) ?? "Nama Almarhum";
    const tanggal = (form.get("tanggal") as string | null)?.trim() ?? "";
    const avFile  = form.get("foto") as File | null;
    const fotoUrl = (form.get("foto_url") as string | null)?.trim() ?? "";

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "wafat", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    const av = await loadFotoSmart(avFile, fotoUrl);
    if (av) {
      const avatarCX = 540;
      const avatarCY = 1188;
      const avatarR  = 283;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const s  = Math.min(av.width, av.height);
      const sx = (av.width - s) / 2;
      const sy = (av.height - s) / 2;
      ctx.drawImage(av, sx, sy, s, s, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();
    }

    const cx = 540;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.font      = "bold 52px WafatFont";
    ctx.fillStyle = "#3a2a22";
    ctx.fillText(nama.toUpperCase(), cx, 1535);

    if (tanggal) {
      ctx.font      = "34px WafatFont";
      ctx.fillStyle = "rgba(58,42,34,0.75)";
      ctx.fillText(tanggal, cx, 1605);
    }

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"wafat.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fd = new FormData();
  fd.append("nama", searchParams.get("nama") ?? "");
  fd.append("tanggal", searchParams.get("tanggal") ?? "");
  fd.append("foto_url", searchParams.get("foto_url") ?? "");
  return POST(new NextRequest(req.url, { method: "POST", body: fd }));
}
