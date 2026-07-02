import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const f1 = path.join(FONTS, "fakeig1.ttf");
  const f2 = path.join(FONTS, "fakeig2.otf");
  if (fs.existsSync(f1)) GlobalFonts.registerFromPath(f1, "IGSemi");
  if (fs.existsSync(f2)) GlobalFonts.registerFromPath(f2, "IGCooper");
  fl = true;
}

export async function POST(req: NextRequest) {
  try {
    const form   = await req.formData();
    const name   = (form.get("name") as string | null)?.trim() || "Someone";
    const text   = (form.get("text") as string | null)?.trim() ?? "";
    const avFile = form.get("avatar") as File | null;
    const avUrl  = (form.get("avatar_url") as string | null)?.trim() ?? "";
    if (!text) return NextResponse.json({ error: "Parameter 'text' wajib diisi" }, { status: 400 });

    ensureFonts();
    const bg = await loadImage(path.join(ASSETS, "fakeig", "bg.jpg"));
    let avatar: Awaited<ReturnType<typeof loadImage>>;
    if (avFile && avFile.size > 0) {
      avatar = await loadImage(Buffer.from(await avFile.arrayBuffer()));
    } else if (avUrl.startsWith("http")) {
      avatar = await loadImage(avUrl);
    } else {
      avatar = await loadImage(fs.readFileSync(path.join(ASSETS, "fakeig", "avatar.jpg")));
    }

    const canvas = createCanvas(bg.width, bg.height);
    const ctx    = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bg, 0, 0);

    const p   = { t: { x:126, y:239 }, b: { x:144, y:359 }, l: { x:72, y:299 }, r: { x:191, y:293 } };
    const cx  = (p.l.x + p.r.x) / 2 + 2;
    const cy  = (p.t.y + p.b.y) / 2;
    const r   = (p.r.x - p.l.x) / 2;
    const s   = Math.min(avatar.width, avatar.height);
    const sx  = (avatar.width - s) / 2;
    const sy  = (avatar.height - s) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(avatar, sx, sy, s, s, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.font = "bold 48px IGSemi";
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(name, cx + r + 25, cy);

    const boxX  = bg.width / 2;
    const boxY  = bg.height / 2 + 60;
    const maxW  = bg.width - 200;
    const maxH  = bg.height * 0.38;

    function wrapLines(t: string, mw: number): string[] {
      const words = t.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if ((ctx.measureText(test) as { width: number }).width > mw && line) { lines.push(line); line = w; }
        else line = test;
      }
      lines.push(line);
      return lines;
    }

    let fsz = 74;
    let lines: string[] = [], lh = 0, th = 0;
    do {
      ctx.font = `bold ${fsz}px IGCooper`;
      lines = wrapLines(text, maxW);
      lh = fsz * 1.1; th = lines.length * lh; fsz -= 2;
    } while ((th > maxH || Math.max(...lines.map(l => (ctx.measureText(l) as { width: number }).width)) > maxW) && fsz > 20);

    ctx.font = `bold ${fsz}px IGCooper`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const startY = boxY - (lines.length * lh / 2) + (lh / 2);
    lines.forEach((l, i) => ctx.fillText(l, boxX, startY + i * lh));

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"fake-ig.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
