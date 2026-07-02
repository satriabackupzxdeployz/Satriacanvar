import { NextResponse } from "next/server";

export async function GET() {
  const lobbies = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    img: `/lobbies/${i + 1}.jpg`,
  }));
  return NextResponse.json({ lobbies });
}
