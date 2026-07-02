import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

let fl = false;
function ensureFonts() {
  if (fl) return;
  const sb = path.join(FONTS, "Inter-SemiBold.otf");
  const b  = path.join(FONTS, "Inter-Bold.otf");
  if (fs.existsSync(sb)) GlobalFonts.registerFromPath(sb, "IGV2SB");
  if (fs.existsSync(b))  GlobalFonts.registerFromPath(b,  "IGV2B");
  fl = true;
}

type Segment = { text: string; red: boolean };

function parseTokens(input: string): Segment[] {
  const tokens: Segment[] = [];
  const regex = /\(([^)]*)\)/g;
  let last = 0, match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > last) tokens.push({ text: input.slice(last, match.index), red: false });
    tokens.push({ text: match[1], red: true });
    last = regex.lastIndex;
  }
  if (last < input.length) tokens.push({ text: input.slice(last), red: false });
  return tokens;
}

function segWidth(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, seg: Segment, fsz: number): number {
  ctx.font = `bold ${fsz}px "${seg.red ? "IGV2B" : "IGV2SB"}"`;
  return (ctx.measureText(seg.text) as { width: number }).width;
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
    const bg = await loadImage(path.join(ASSETS, "fakeig2", "bg.jpg"));
    let avatar;
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

    const p  = { cx: 115, cy: 388, r: 68 };
    const s  = Math.min(avatar.width, avatar.height);
    const sx = (avatar.width - s) / 2;
    const sy = (avatar.height - s) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(avatar, sx, sy, s, s, p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    ctx.restore();

    ctx.font = `bold 55px "IGV2SB"`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(name, p.cx + p.r + 25, p.cy);

    const SAFE_PX = 100, SAFE_PT = 480, SAFE_PB = 480;
    const safeLeft = SAFE_PX, safeRight = bg.width - SAFE_PX;
    const safeTop  = SAFE_PT, safeBottom = bg.height - SAFE_PB;
    const safeW    = safeRight - safeLeft;
    const safeH    = safeBottom - safeTop;
    const safeCX   = bg.width / 2;
    const safeCY   = (safeTop + safeBottom) / 2;

    const tokens = parseTokens(text);

    function wrapTokens(fsz: number): Segment[][] {
      const lines: Segment[][] = [];
      const words: Segment[] = [];
      for (const tok of tokens) {
        for (const p2 of tok.text.split(/(\s+)/)) {
          if (p2 !== "") words.push({ text: p2, red: tok.red });
        }
      }
      let curLine: Segment[] = [], curW = 0;
      for (const word of words) {
        if (/^\s+$/.test(word.text)) {
          if (curLine.length > 0) {
            ctx.font = `bold ${fsz}px "IGV2SB"`;
            const spW = (ctx.measureText(" ") as { width: number }).width;
            curW += spW;
            const last = curLine[curLine.length - 1];
            if (last.red === word.red) last.text += word.text;
            else curLine.push({ text: word.text, red: word.red });
          }
          continue;
        }
        const wordW = segWidth(ctx, word, fsz);
        ctx.font = `bold ${fsz}px "IGV2SB"`;
        const spW = (ctx.measureText(" ") as { width: number }).width;
        const addW = curLine.length > 0 ? spW + wordW : wordW;
        if (curW + addW > safeW && curLine.length > 0) {
          lines.push(curLine); curLine = [{ text: word.text, red: word.red }]; curW = wordW;
        } else {
          if (curLine.length > 0) {
            const last = curLine[curLine.length - 1];
            if (last.red === word.red) last.text += " " + word.text;
            else { curLine.push({ text: " ", red: false }); curLine.push({ text: word.text, red: word.red }); }
            curW += spW + wordW;
          } else { curLine.push({ text: word.text, red: word.red }); curW = wordW; }
        }
      }
      if (curLine.length > 0) lines.push(curLine);
      return lines;
    }

    const MAX_FONT = 65, MIN_FONT = 18;
    let fsz = MAX_FONT;
    let lines: Segment[][] = [], lh = 0, totalH = 0;
    do {
      lh = fsz * 1.25;
      lines = wrapTokens(fsz);
      totalH = lines.length * lh;
      if (totalH <= safeH) break;
      fsz -= 1;
    } while (fsz > MIN_FONT);

    ctx.textBaseline = "middle";
    let startY = safeCY - totalH / 2 + lh / 2;

    for (let i = 0; i < lines.length; i++) {
      const segs = lines[i];
      const totalW = segs.reduce((sum, seg) => sum + segWidth(ctx, seg, fsz), 0);
      let x = safeCX - totalW / 2;
      const y = startY + i * lh;
      for (const seg of segs) {
        ctx.font = `bold ${fsz}px "${seg.red ? "IGV2B" : "IGV2SB"}"`;
        ctx.fillStyle = seg.red ? "#e51a1a" : "#000000";
        ctx.textAlign = "left";
        ctx.fillText(seg.text, x, y);
        x += (ctx.measureText(seg.text) as { width: number }).width;
      }
    }

    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png", "Content-Disposition": "inline; filename=\"fake-ig-v2.png\"", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
