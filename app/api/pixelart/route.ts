import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

function getBlock(level: number): number {
  const val = Math.min(Math.max(Number(level) || 12, 1), 40);
  return 41 - val;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("image") as File | null;
    const imageUrl = (formData.get("image_url") as string | null)?.trim() ?? "";
    const levelRaw = formData.get("level");
    const level    = levelRaw ? Number(levelRaw) : 20;

    if ((!file || file.size === 0) && !imageUrl.startsWith("http")) {
      return NextResponse.json({ error: "Field 'image' atau 'image_url' wajib diisi" }, { status: 400 });
    }

    const inputBuffer = file && file.size > 0
      ? Buffer.from(await file.arrayBuffer())
      : Buffer.from(await (await fetch(imageUrl)).arrayBuffer());
    const image       = sharp(inputBuffer, { limitInputPixels: false }).rotate().ensureAlpha();
    const meta        = await image.metadata();

    const width  = meta.width  ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) return NextResponse.json({ error: "Gagal membaca dimensi gambar" }, { status: 400 });

    const block  = getBlock(level);
    const input  = await image.raw().toBuffer();
    const output = Buffer.alloc(input.length);

    for (let y = 0; y < height; y += block) {
      for (let x = 0; x < width; x += block) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        const maxY = Math.min(y + block, height);
        const maxX = Math.min(x + block, width);
        for (let yy = y; yy < maxY; yy++) {
          for (let xx = x; xx < maxX; xx++) {
            const i = (yy * width + xx) * 4;
            r += input[i]; g += input[i + 1];
            b += input[i + 2]; a += input[i + 3];
            count++;
          }
        }
        r = Math.round(r / count); g = Math.round(g / count);
        b = Math.round(b / count); a = Math.round(a / count);
        for (let yy = y; yy < maxY; yy++) {
          for (let xx = x; xx < maxX; xx++) {
            const i = (yy * width + xx) * 4;
            output[i] = r; output[i + 1] = g;
            output[i + 2] = b; output[i + 3] = a;
          }
        }
      }
    }

    const resultBuffer = await sharp(output, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toBuffer();

    return new NextResponse(new Uint8Array(resultBuffer), {
      headers: {
        "Content-Type":        "image/png",
        "Content-Disposition": "inline; filename=\"pixel-art.png\"",
        "Cache-Control":       "no-store",
        "X-Pixel-Level":       String(level),
        "X-Block-Size":        String(block),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
