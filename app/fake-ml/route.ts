import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "ml");

const RANK_CONFIG: Record<string, { size: number; x: number; y: number }> = {
  epic:   { size: 210, x: 388, y: 760 },
  glory:  { size: 210, x: 387, y: 760 },
  gm:     { size: 260, x: 358, y: 760 },
  honor:  { size: 210, x: 384, y: 760 },
  imo:    { size: 260, x: 358, y: 760 },
  legend: { size: 260, x: 360, y: 760 },
  mawi:   { size: 210, x: 387, y: 760 },
};

const BORDER_OFFSET: Record<number, number> = {
  1:26,2:36,3:26,4:26,5:26,6:26,7:26,8:26,9:26,
  10:26,11:22,12:28,13:26,14:21,15:26,16:26,
};

const LOBBY_BACKGROUNDS: Record<string, string> = {
  jp:   "Lobby.jpg",
  indo: "lobby-indo.jpg",
};

const VALID_RANKS = Object.keys(RANK_CONFIG);
const AVATAR_CFG  = { x:389, y:446, size:204, r:12 };
const OUTLINE     = { color:"#b8956f", thickness:4 };
const RANK_BASE   = { x:387, y:760, size:210 };
const FLAG_CFG    = { x:364, y:428, size:55 };
const USERNAME_CFG = { a:681, b:727, c:400, d:609, centerX:496, fontSize:36, maxChars:15 };
const CANVAS_W = 960, CANVAS_H = 1706;

function calcH(img: { width: number; height: number }, size: number) {
  return size * (img.height / img.width);
}

async function loadFromUrl(url: string) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return loadImage(Buffer.from(buf));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username   = searchParams.get("usr");
    const rank       = searchParams.get("rank");
    const border     = searchParams.get("border");
    const avatar     = searchParams.get("avatar");
    const lobby_type = searchParams.get("lobby_type") ?? "jp";

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Parameter 'usr' wajib diisi", example: "/fake-ml?usr=PlayerName&rank=imo&border=1&lobby_type=jp" },
        { status: 400 }
      );
    }

    if (rank && !VALID_RANKS.includes(rank)) {
      return NextResponse.json(
        { error: `Rank tidak valid. Gunakan salah satu: ${VALID_RANKS.join(", ")}` },
        { status: 400 }
      );
    }

    const borderNum = border !== null && border !== "" ? Number(border) : 0;
    if (border !== null && border !== "" && (isNaN(borderNum) || borderNum < 0 || borderNum > 16)) {
      return NextResponse.json({ error: "Parameter 'border' harus angka antara 0–16 (0 = tanpa border)" }, { status: 400 });
    }

    const safeName   = username.trim().slice(0, 15) || "Player";
    const safeRank   = rank && VALID_RANKS.includes(rank) ? rank : "imo";
    const safeBorder = borderNum;
    const useBorder  = safeBorder > 0 && safeBorder <= 16;
    const safeLobby  = Object.keys(LOBBY_BACKGROUNDS).includes(lobby_type) ? lobby_type : "jp";
    const lobbyFile  = LOBBY_BACKGROUNDS[safeLobby];

    const fontPath = path.join(ASSETS, "noto-sans.regular.ttf");
    if (fs.existsSync(fontPath)) GlobalFonts.registerFromPath(fontPath, "NotoSans");

    const lobbyImg = await loadImage(path.join(ASSETS, lobbyFile));
    const flagImg  = await loadImage(path.join(ASSETS, "Bendera.svg"));
    const rankImg  = await loadImage(path.join(ASSETS, "rank", `${safeRank}.webp`));

    let avatarImg;
    if (avatar && typeof avatar === "string" && avatar.startsWith("http")) {
      try { avatarImg = await loadFromUrl(avatar); } catch { avatarImg = await loadImage(path.join(ASSETS, "avatar.jpg")); }
    } else {
      avatarImg = await loadImage(path.join(ASSETS, "avatar.jpg"));
    }

    let borderImg = null;
    if (useBorder) {
      const bp = path.join(ASSETS, "border", `${safeBorder}.webp`);
      if (fs.existsSync(bp)) borderImg = await loadImage(bp);
    }

    const canvas = createCanvas(CANVAS_W, CANVAS_H);
    const ctx    = canvas.getContext("2d");

    ctx.drawImage(lobbyImg, 0, 0, CANVAS_W, CANVAS_H);

    const { x:ax, y:ay, size:as, r } = AVATAR_CFG;
    const ah = calcH(avatarImg, as);

    if (!useBorder || !borderImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ax - OUTLINE.thickness, ay - OUTLINE.thickness, as + OUTLINE.thickness*2, ah + OUTLINE.thickness*2, r + OUTLINE.thickness);
      ctx.strokeStyle = OUTLINE.color;
      ctx.lineWidth   = OUTLINE.thickness * 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ax, ay, as, ah, r);
    ctx.clip();
    ctx.drawImage(avatarImg, ax, ay, as, ah);
    ctx.restore();

    if (useBorder && borderImg) {
      const offset = BORDER_OFFSET[safeBorder] ?? 26;
      const bSize  = as + offset * 2;
      ctx.drawImage(borderImg, ax - offset, ay - offset, bSize, bSize);
    }

    const rankCfg = RANK_CONFIG[safeRank] ?? RANK_BASE;
    const rh = calcH(rankImg, rankCfg.size);
    ctx.drawImage(rankImg, rankCfg.x, rankCfg.y, rankCfg.size, rh);

    const frad = FLAG_CFG.size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(FLAG_CFG.x + frad, FLAG_CFG.y + frad, frad, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(flagImg, FLAG_CFG.x, FLAG_CFG.y, FLAG_CFG.size, FLAG_CFG.size);
    ctx.restore();

    const { a, b, c, d, centerX, fontSize, maxChars } = USERNAME_CFG;
    const name = safeName.slice(0, maxChars);
    const boxW = d - c;
    const boxH = b - a;
    let sz = fontSize;
    ctx.textAlign    = "center";
    ctx.textBaseline = "alphabetic";
    while (sz > 8) {
      ctx.font = `${sz}px NotoSans`;
      if (ctx.measureText(name).width <= boxW) break;
      sz -= 1;
    }
    ctx.fillStyle = "#ffffff";
    ctx.font      = `${sz}px NotoSans`;
    ctx.fillText(name, centerX, a + boxH / 2 + sz / 3);

    const buffer = await canvas.encode("png");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": `inline; filename="ml-${safeName}-${safeRank}-${safeLobby}.png"`,
        "Cache-Control":       "no-store",
        "X-Username":          safeName,
        "X-Rank":              safeRank,
        "X-Border":            String(safeBorder),
        "X-Lobby-Type":        safeLobby,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
