import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded) return;
  const mono = path.join(FONTS, "JetBrainsMono.ttf");
  if (fs.existsSync(mono)) GlobalFonts.registerFromPath(mono, "DevMono");
  fontsLoaded = true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name     = String(body.name     ?? "Satriadevs").trim().slice(0, 30);
    const title    = String(body.title    ?? "developer").trim().slice(0, 30);
    const script   = String(body.script   ?? "md").trim().slice(0, 30);
    const telegram = String(body.telegram ?? "@Satriadevs").trim().slice(0, 40);

    ensureFonts();

    const bgPath = path.join(ASSETS, "dev", "bg.jpg");
    const bg     = await loadImage(bgPath);
    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "top";

    ctx.font      = "30px DevMono";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${name}.json`, 255, 488);

    ctx.font      = "27px DevMono";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("{", 190, 580);

    const rows: [string, string, number][] = [
      [`"name"`,     `: "${name}",`,     630],
      [`"title"`,    `: "${title}",`,    680],
      [`"script"`,   `: "${script}",`,   735],
      [`"telegram"`, `: "${telegram}"`,  790],
    ];
    for (const [key, val, y] of rows) {
      ctx.fillStyle = "#8A9A5B";
      ctx.fillText(key, 250, y);
      ctx.fillStyle = "#00b7ff";
      const kw = (ctx.measureText(key) as { width: number }).width;
      ctx.fillText(val, 250 + kw, y);
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("}", 190, 850);

    const buffer = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": `inline; filename="devcard-${name}.png"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name:     searchParams.get("name"),
      title:    searchParams.get("title"),
      script:   searchParams.get("script"),
      telegram: searchParams.get("telegram"),
    }),
  }));
}
