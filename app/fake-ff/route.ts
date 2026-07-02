import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("usr");
    const lobby = searchParams.get("lobby");

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Parameter 'usr' wajib diisi", example: "/fake-ff?usr=PlayerName&lobby=1" },
        { status: 400 }
      );
    }

    const sanitized = username.trim().slice(0, 20);
    const lobbyNum = lobby ? Math.max(1, Math.min(Number(lobby), 30)) : null;

    if (lobby && (isNaN(Number(lobby)) || Number(lobby) < 1 || Number(lobby) > 30)) {
      return NextResponse.json(
        { error: "Parameter 'lobby' harus angka antara 1–30", valid_range: "1-30" },
        { status: 400 }
      );
    }

    const generateFF = require("fake-ff");

    const tmpDir = os.tmpdir();
    const outDir = path.join(tmpDir, `satriaff_pub_${Date.now()}`);
    fs.mkdirSync(outDir, { recursive: true });

    const result = await generateFF({
      username: sanitized,
      lobby: lobbyNum,
      outputDir: outDir,
    });

    const imgPath = result.result;
    if (!fs.existsSync(imgPath)) {
      return NextResponse.json({ error: "Gagal generate gambar" }, { status: 500 });
    }

    const imgBuffer = fs.readFileSync(imgPath);
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch {}

    return new NextResponse(imgBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `inline; filename="ff-${sanitized}-lobby${result.lobby}.jpg"`,
        "Cache-Control": "no-store",
        "X-Username": sanitized,
        "X-Lobby": String(result.lobby),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
