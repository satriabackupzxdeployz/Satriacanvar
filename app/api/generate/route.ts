import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, lobby } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username wajib diisi" }, { status: 400 });
    }

    const sanitized = username.trim().slice(0, 20);
    const lobbyNum = lobby ? Math.max(1, Math.min(Number(lobby), 30)) : null;

    const generateFF = require("fake-ff");

    const tmpDir = os.tmpdir();
    const outDir = path.join(tmpDir, `satriaff_${Date.now()}`);
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
    const base64 = imgBuffer.toString("base64");

    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch {}

    return NextResponse.json({
      status: "success",
      username: result.username,
      lobby: result.lobby,
      image: `data:image/jpeg;base64,${base64}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
