import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const r = path.join(FONTS, "balogo-rog.otf");
  const g = path.join(FONTS, "balogo-glow.otf");
  if (fs.existsSync(r)) GlobalFonts.registerFromPath(r, "BArog");
  if (fs.existsSync(g)) GlobalFonts.registerFromPath(g, "BAglow");
  fl = true;
}

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json();
    const textL = String(body.left        ?? "").trim().slice(0, 30);
    const textR = String(body.right       ?? "").trim().slice(0, 30);
    const transparent = body.transparent === true;

    if (!textL || !textR) return NextResponse.json({ error: "Parameter 'left' dan 'right' wajib diisi" }, { status: 400 });

    ensureFonts();
    const halo  = await loadImage(path.join(ASSETS, "balogo", "halo.png"));
    const cross = await loadImage(path.join(ASSETS, "balogo", "cross.png"));

    const fontSize = 84;
    const canvasH  = 250;
    const hTilt    = -0.4;
    const textBase = 0.68;
    const padX     = 10;
    const font     = `${fontSize}px BArog`;

    const tmp  = createCanvas(900, canvasH);
    const tctx = tmp.getContext("2d");
    tctx.font  = font;
    const mL   = tctx.measureText(textL) as { width: number; fontBoundingBoxDescent: number; fontBoundingBoxAscent: number };
    const mR   = tctx.measureText(textR) as { width: number; fontBoundingBoxDescent: number; fontBoundingBoxAscent: number };

    const wL    = mL.width - (textBase * canvasH + (mL.fontBoundingBoxDescent || 10)) * hTilt;
    const wR    = mR.width + (textBase * canvasH - (mR.fontBoundingBoxAscent  || 60)) * hTilt;
    const halfL = Math.max(450, wL + padX);
    const halfR = Math.max(450, wR + padX);

    const canvas = createCanvas(Math.round(halfL + halfR), canvasH);
    const ctx    = canvas.getContext("2d");

    if (!transparent) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvasH); }

    const cx = halfL;
    const y  = canvasH * textBase;

    ctx.setTransform(1, 0, hTilt, 1, 0, 0);
    ctx.fillStyle = "#128AFA"; ctx.textAlign = "end"; ctx.font = font;
    ctx.fillText(textL, cx, y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const gx = cx - canvasH / 2 + (-15);
    ctx.drawImage(halo, gx, 0, canvasH, canvasH);

    ctx.setTransform(1, 0, hTilt, 1, 0, 0);
    ctx.textAlign = "start"; ctx.font = font;
    ctx.lineWidth = 12; ctx.strokeStyle = "#ffffff"; ctx.fillStyle = "#2B2B2B";
    ctx.strokeText(textR, cx, y); ctx.fillText(textR, cx, y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const hp = [[284,136],[321,153],[159,410],[148,403]] as const;
    ctx.beginPath();
    ctx.moveTo(gx+(hp[0][0]/500)*canvasH, 0+(hp[0][1]/500)*canvasH);
    for(let i=1;i<4;i++) ctx.lineTo(gx+(hp[i][0]/500)*canvasH, 0+(hp[i][1]/500)*canvasH);
    ctx.closePath(); ctx.fillStyle="#ffffff"; ctx.fill();
    ctx.drawImage(cross, gx, 0, canvasH, canvasH);

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"balogo.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
