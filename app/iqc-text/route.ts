import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const ASSETS_IQC = path.join(process.cwd(), "assets", "iqc");

function ensureIqcAssets() {
  const modAssets = path.join(process.cwd(), "node_modules", "iqc-canvas", "assets");
  if (!fs.existsSync(modAssets)) return;
  const pairs: [string, string][] = [
    [path.join(ASSETS_IQC, "bg",    "background.png"),          path.join(modAssets, "background.png")],
    [path.join(ASSETS_IQC, "fonts", "SFPRODISPLAYREGULAR.OTF"), path.join(modAssets, "SFPRODISPLAYREGULAR.otf")],
  ];
  for (const [src, dest] of pairs) {
    if (!fs.existsSync(dest) && fs.existsSync(src)) fs.copyFileSync(src, dest);
  }
}

type IqcOptions = { baterai: [boolean, string]; operator: boolean; timebar: boolean; wifi: boolean };

async function callIqcCanvas(text: string, time: string, opts: IqcOptions): Promise<Buffer> {
  ensureIqcAssets();
  const { generateIQC } = require("iqc-canvas") as {
    generateIQC: (t: string, tm: string, o?: IqcOptions) => Promise<{ success: boolean; image: Buffer }>;
  };
  const result = await generateIQC(text, time, opts);
  if (!result.success) throw new Error("IQC canvas gagal dirender");
  return result.image;
}

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const text     = String(body.text  ?? "").trim();
    const time     = String(body.time  ?? "").trim();
    const baterai  = body.baterai  !== undefined ? (body.baterai  as [boolean, string]) : ([true, "100"] as [boolean, string]);
    const operator = body.operator !== undefined ? Boolean(body.operator) : true;
    const timebar  = body.timebar  !== undefined ? Boolean(body.timebar)  : true;
    const wifi     = body.wifi     !== undefined ? Boolean(body.wifi)     : true;

    if (!text) return NextResponse.json({ error: "Parameter 'text' wajib diisi" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "Parameter 'time' wajib diisi" }, { status: 400 });

    const buffer = await callIqcCanvas(text, time, { baterai, operator, timebar, wifi });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": `inline; filename="iqc-text-${Date.now()}.png"`,
        "Cache-Control":       "no-store",
        "X-Text":              encodeURIComponent(text.slice(0, 50)),
        "X-Time":              time,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const time = searchParams.get("time");
  if (!text?.trim()) return NextResponse.json({ error: "Parameter 'text' wajib diisi", example: "/iqc-text?text=Halo+kak&time=13.56" }, { status: 400 });
  if (!time?.trim()) return NextResponse.json({ error: "Parameter 'time' wajib diisi" }, { status: 400 });
  const baterai  = searchParams.get("baterai")   !== "false";
  const batLevel = searchParams.get("bat_level") ?? "100";
  const operator = searchParams.get("operator")  !== "false";
  const timebar  = searchParams.get("timebar")   !== "false";
  const wifi     = searchParams.get("wifi")      !== "false";
  return POST(new NextRequest(req.url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text: text.trim(), time: time.trim(), baterai: [baterai, batLevel], operator, timebar, wifi }),
  }));
}
