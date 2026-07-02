import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const sb = path.join(FONTS, "SFPRODISPLAYSEMIBOLD.ttf");
  const rg = path.join(FONTS, "SFPRODISPLAYREGULAR.OTF");
  if (fs.existsSync(sb)) GlobalFonts.registerFromPath(sb, "RmdSemi");
  if (fs.existsSync(rg)) GlobalFonts.registerFromPath(rg, "RmdReg");
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
    const body  = await req.json();
    const title = String(body.title ?? "").trim().slice(0, 60);
    const pesan = String(body.pesan ?? "").trim().slice(0, 300);
    const waktu = String(body.waktu ?? "").trim().slice(0, 30);
    if (!title) return NextResponse.json({ error: "Parameter 'title' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg     = await loadImage(path.join(ASSETS, "reminder", "bg.jpg"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    const cx   = bg.width / 2;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.font      = "bold 88px RmdSemi";
    ctx.fillStyle = "#1a1a1a";
    const titleLines = wrap(ctx, title, bg.width - 200);
    const tlh        = 100;
    let titleY       = 320;
    titleLines.slice(0, 2).forEach((l, i) => { ctx.fillText(l, cx, titleY + i * tlh); });
    titleY += titleLines.slice(0, 2).length * tlh + 30;

    if (waktu) {
      ctx.font      = "54px RmdReg";
      ctx.fillStyle = "#555555";
      ctx.fillText(waktu, cx, titleY);
      titleY += 80;
    }

    if (pesan) {
      ctx.font      = "54px RmdReg";
      ctx.fillStyle = "#333333";
      const pLines  = wrap(ctx, pesan, bg.width - 220);
      const plh     = 68;
      pLines.slice(0, 5).forEach((l, i) => ctx.fillText(l, cx, titleY + 30 + i * plh));
    }

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"reminder.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  if (!title?.trim()) return NextResponse.json({ error: "Parameter 'title' wajib diisi" }, { status: 400 });
  return POST(new NextRequest(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, pesan: searchParams.get("pesan"), waktu: searchParams.get("waktu") }) }));
}
