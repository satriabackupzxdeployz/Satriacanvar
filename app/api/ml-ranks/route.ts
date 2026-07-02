import { NextResponse } from "next/server";

const RANKS = [
  { key: "imo",    label: "Immortal",    color: "#e8d5a3" },
  { key: "mawi",   label: "Mythic",      color: "#c084fc" },
  { key: "legend", label: "Legend",      color: "#f97316" },
  { key: "epic",   label: "Epic",        color: "#a855f7" },
  { key: "gm",     label: "Grandmaster", color: "#60a5fa" },
  { key: "glory",  label: "Glory",       color: "#34d399" },
  { key: "honor",  label: "Honor",       color: "#94a3b8" },
];

const BORDERS = Array.from({ length: 16 }, (_, i) => ({
  id:  i + 1,
  img: `/ml/border/${i + 1}.webp`,
}));

const LOBBY_TYPES = [
  { key: "jp",   label: "Lobby Jepang" },
  { key: "indo", label: "Lobby Indo"   },
];

export async function GET() {
  return NextResponse.json({ ranks: RANKS, borders: BORDERS, lobbyTypes: LOBBY_TYPES });
}
