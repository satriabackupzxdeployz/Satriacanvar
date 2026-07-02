"use client";
import { useState } from "react";

const DOMAIN = "satriacanvas.vercel.app";

const FF_LOBBIES = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, img: `/lobbies/${i + 1}.jpg` }));
const ML_RANKS = [
  { key: "imo",    label: "Immortal",    color: "#e8d5a3" },
  { key: "mawi",   label: "Mythic",      color: "#c084fc" },
  { key: "legend", label: "Legend",      color: "#f97316" },
  { key: "epic",   label: "Epic",        color: "#a855f7" },
  { key: "gm",     label: "Grandmaster", color: "#60a5fa" },
  { key: "glory",  label: "Glory",       color: "#34d399" },
  { key: "honor",  label: "Honor",       color: "#94a3b8" },
];
const ML_BORDERS = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, img: `/ml/border/${i + 1}.webp` }));

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }} style={{ padding: "4px 12px", background: copied ? "var(--ink)" : "var(--paper)", border: "2px solid var(--ink)", borderRadius: "999px", color: copied ? "var(--paper)" : "var(--ink)", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.13s", boxShadow: copied ? "none" : "1px 1px 0 0 var(--ink)", whiteSpace: "nowrap" }}>
      {copied ? "COPIED!" : "COPY"}
    </button>
  );
}

const TOKENS: Record<string, { pattern: RegExp; color: string }[]> = {
  bash: [
    { pattern: /^(curl|npm|node|npx|pip|python|python3|git|cd|ls|mkdir|cp|mv|rm|cat|echo|export|source)\b/gm, color: "#79c0ff" },
    { pattern: /(-o|-F|-H|-X|-d|-L|--[a-zA-Z-]+)\b/g, color: "#ffab70" },
    { pattern: /"([^"]*)"/g, color: "#a5d6ff" },
    { pattern: /'([^']*)'/g, color: "#a5d6ff" },
    { pattern: /`([^`]*)`/g, color: "#a5d6ff" },
    { pattern: /(https?:\/\/[^\s"']+)/g, color: "#7ee787" },
    { pattern: /(#.*$)/gm, color: "#8b949e" },
  ],
  javascript: [
    { pattern: /\b(const|let|var|function|async|await|return|if|else|for|while|try|catch|new|import|from|export|default|class|extends|typeof|instanceof)\b/g, color: "#ff7b72" },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: "#79c0ff" },
    { pattern: /`([^`]*)`/g, color: "#a5d6ff" },
    { pattern: /"([^"]*)"/g, color: "#a5d6ff" },
    { pattern: /'([^']*)'/g, color: "#a5d6ff" },
    { pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/g, color: "#ffa657" },
    { pattern: /\/\/.*/g, color: "#8b949e" },
    { pattern: /\/\*[\s\S]*?\*\//g, color: "#8b949e" },
    { pattern: /\b(\d+)\b/g, color: "#79c0ff" },
  ],
  python: [
    { pattern: /\b(def|class|import|from|return|if|elif|else|for|while|try|except|with|as|in|not|and|or|lambda|pass|raise|yield|async|await)\b/g, color: "#ff7b72" },
    { pattern: /\b(True|False|None)\b/g, color: "#79c0ff" },
    { pattern: /f"([^"]*)"/g, color: "#a5d6ff" },
    { pattern: /"([^"]*)"/g, color: "#a5d6ff" },
    { pattern: /'([^']*)'/g, color: "#a5d6ff" },
    { pattern: /#.*/g, color: "#8b949e" },
    { pattern: /\b(\d+)\b/g, color: "#79c0ff" },
  ],
  json: [
    { pattern: /"([^"]+)"(?=\s*:)/g, color: "#79c0ff" },
    { pattern: /:\s*"([^"]*)"/g, color: "#a5d6ff" },
    { pattern: /\b(true|false|null)\b/g, color: "#ffab70" },
    { pattern: /\b(\d+)\b/g, color: "#79c0ff" },
  ],
  text: [],
};

function highlightCode(code: string, lang: string): React.ReactNode[] {
  if (lang === "text" || !TOKENS[lang]) {
    return [<span key="0" style={{ color: "#e6edf3" }}>{code}</span>];
  }
  const tokens = TOKENS[lang];
  type Seg = { start: number; end: number; color: string; text: string };
  const segments: Seg[] = [];
  for (const { pattern, color } of tokens) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      segments.push({ start: m.index, end: m.index + m[0].length, color, text: m[0] });
    }
  }
  segments.sort((a, b) => a.start - b.start);
  const merged: Seg[] = [];
  for (const seg of segments) {
    if (merged.length === 0 || seg.start >= merged[merged.length - 1].end) {
      merged.push(seg);
    }
  }
  const result: React.ReactNode[] = [];
  let cursor = 0;
  for (const seg of merged) {
    if (seg.start > cursor) {
      result.push(<span key={cursor} style={{ color: "#e6edf3" }}>{code.slice(cursor, seg.start)}</span>);
    }
    result.push(<span key={seg.start} style={{ color: seg.color }}>{seg.text}</span>);
    cursor = seg.end;
  }
  if (cursor < code.length) {
    result.push(<span key={cursor} style={{ color: "#e6edf3" }}>{code.slice(cursor)}</span>);
  }
  return result;
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const trimmed = code.trim();
  return (
    <div style={{ background: "#0d1117", border: "2px solid var(--ink)", borderRadius: "var(--radius-md)", boxShadow: "4px 4px 0 0 var(--ink)", overflow: "hidden", marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #30363d", background: "#161b22" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56", border: "1.5px solid rgba(0,0,0,0.3)" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e", border: "1.5px solid rgba(0,0,0,0.3)" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f", border: "1.5px solid rgba(0,0,0,0.3)" }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: "#8b949e", fontFamily: "monospace", fontWeight: 600 }}>{lang}</span>
        </div>
        <CopyBtn text={trimmed} />
      </div>
      <pre style={{ margin: 0, padding: "16px 18px", overflowX: "auto", fontSize: 13, lineHeight: 1.7, fontFamily: "ui-monospace, 'JetBrains Mono', monospace", whiteSpace: "pre" }}>
        <code>{highlightCode(trimmed, lang)}</code>
      </pre>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", background: color, border: "2px solid var(--ink)", borderRadius: "999px", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "var(--ink)", boxShadow: "1px 1px 0 0 var(--ink)" }}>{children}</span>;
}

function ParamRow({ name, type, required, def, desc }: { name: string; type: string; required: boolean; def?: string; desc: string }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(26,26,26,0.1)" }}>
      <td style={{ padding: "10px 14px" }}>
        <code style={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "var(--ink)" }}>{name}</code>
        {required && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, color: "#c0392b", letterSpacing: "0.1em" }}>WAJIB</span>}
      </td>
      <td style={{ padding: "10px 14px" }}><code style={{ fontSize: 11, background: "rgba(26,26,26,0.07)", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace", color: "var(--ink-soft)" }}>{type}</code></td>
      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-muted)", fontWeight: 600 }}>{def ?? "—"}</td>
      <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>{desc}</td>
    </tr>
  );
}

const TH: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "var(--ink-muted)", borderBottom: "2px solid var(--ink)", background: "var(--cream)", textTransform: "uppercase", whiteSpace: "nowrap" };

function SectionTitle({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, marginTop: 40 }}>
      <div style={{ width: 32, height: 32, background: "var(--ink)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)", fontSize: 12, fontWeight: 900, boxShadow: "2px 2px 0 0 rgba(26,26,26,0.3)", flexShrink: 0 }}>{num}</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.02em" }}>{children}</h2>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "var(--radius-lg)", boxShadow: "4px 4px 0 0 var(--ink)", overflow: "hidden", marginBottom: 20 }}>{children}</div>;
}

function CardHeader({ label, badge, badgeColor = "#a8e8c9" }: { label: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: "2px solid var(--ink)", background: "var(--ink)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", color: "var(--paper)", textTransform: "uppercase" }}>{label}</span>
      {badge && <Badge color={badgeColor}>{badge}</Badge>}
    </div>
  );
}

function RespHeaderTable({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Header","Nilai"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(([h, v], i) => (
            <tr key={h} style={{ borderBottom: "1px solid rgba(26,26,26,0.1)", background: i % 2 === 0 ? "var(--paper)" : "var(--cream)" }}>
              <td style={{ padding: "9px 14px" }}><code style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--ink)" }}>{h}</code></td>
              <td style={{ padding: "9px 14px", fontSize: 12, color: "var(--ink-muted)", fontFamily: "monospace", fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniEndpoint({ method, path, badge, badgeColor, desc, params, examples }: { method: string; path: string; badge: string; badgeColor: string; desc: string; params: { name: string; type: string; required: boolean; def?: string; desc: string }[]; examples: { lang: string; code: string }[] }) {
  return (
    <Card>
      <CardHeader label={`${method}  ${path}`} badge={badge} badgeColor={badgeColor} />
      <div style={{ padding: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>{desc}</p>
        {params.length > 0 && (
          <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {params.map(p => <ParamRow key={p.name} name={p.name} type={p.type} required={p.required} def={p.def} desc={p.desc} />)}
              </tbody>
            </table>
          </div>
        )}
        {examples.map((ex, i) => <CodeBlock key={i} lang={ex.lang} code={ex.code} />)}
      </div>
    </Card>
  );
}

const OTHER_ENDPOINTS: { method: string; path: string; badge: string; badgeColor: string; desc: string; params: { name: string; type: string; required: boolean; def?: string; desc: string }[]; examples: { lang: string; code: string }[] }[] = [
  {
    method: "GET / POST", path: "/api/igstory-img", badge: "PNG", badgeColor: "#ffd8f0",
    desc: "Generate IG story bergaya share post Instagram. Foto postingan dan foto profil bisa upload file atau URL. Keduanya opsional.",
    params: [
      { name: "nama",     type: "string",       required: false, def: "Someone",  desc: "Nama yang tampil di header story, maksimal 40 karakter." },
      { name: "username", type: "string",       required: false, def: "someone",  desc: "Username Instagram, maksimal 30 karakter." },
      { name: "foto",     type: "file",         required: false, def: "—",        desc: "Foto postingan (multipart/form-data)." },
      { name: "foto_url", type: "string (URL)", required: false, def: "—",        desc: "URL foto postingan, alternatif dari upload file." },
      { name: "pp",       type: "file",         required: false, def: "—",        desc: "Foto profil (multipart/form-data)." },
      { name: "pp_url",   type: "string (URL)", required: false, def: "—",        desc: "URL foto profil, alternatif dari upload file." },
    ],
    examples: [
      { lang: "bash", code: `curl -o igstory.png -F "nama=Satriadevs" -F "username=satriadevs" -F "foto=@foto.jpg" -F "pp=@pp.jpg" "https://${DOMAIN}/api/igstory-img"` },
      { lang: "bash", code: `curl -o igstory.png "https://${DOMAIN}/api/igstory-img?nama=Satriadevs&username=satriadevs&foto_url=https://contoh.com/foto.jpg&pp_url=https://contoh.com/pp.jpg"` },
    ],
  },
  {
    method: "GET / POST", path: "/api/iqc-dark", badge: "PNG", badgeColor: "#c8d8ff",
    desc: "Generate chat bubble dark bergaya iPhone. Bisa gabungan gambar dan teks, atau salah satu saja. Dilengkapi emoji reaction bar.",
    params: [
      { name: "time",      type: "string",       required: false, def: "00.00", desc: "Waktu pesan, contoh: 22.54." },
      { name: "text",      type: "string",       required: false, def: "—",     desc: "Teks pesan, maksimal 500 karakter. Opsional jika ada gambar." },
      { name: "image",     type: "file",         required: false, def: "—",     desc: "Gambar dalam bubble (multipart/form-data). Opsional jika ada teks." },
      { name: "image_url", type: "string (URL)", required: false, def: "—",     desc: "URL gambar, alternatif dari upload file." },
    ],
    examples: [
      { lang: "bash", code: `curl -o iqcdark.png "https://${DOMAIN}/api/iqc-dark?text=Halo+kak&time=22.54"` },
      { lang: "bash", code: `curl -o iqcdark.png -F "text=Caption gambar" -F "image=@foto.jpg" -F "time=22.54" "https://${DOMAIN}/api/iqc-dark"` },
      { lang: "bash", code: `curl -o iqcdark.png -F "image_url=https://contoh.com/foto.jpg" "https://${DOMAIN}/api/iqc-dark"` },
    ],
  },
  {
    method: "GET / POST", path: "/api/fake-dana", badge: "PNG", badgeColor: "#b8d8ff",
    desc: "Generate tampilan saldo DANA. Nominal otomatis diformat dengan titik ribuan.",
    params: [
      { name: "amount", type: "string", required: true, def: "—", desc: "Nominal saldo, angka saja tanpa titik/koma. Contoh: 1500000." },
      { name: "nama", type: "string", required: false, def: "—", desc: "Nama pemilik akun (opsional)." },
    ],
    examples: [
      { lang: "bash", code: `curl -o fake_dana.png "https://${DOMAIN}/api/fake-dana?amount=1500000&nama=Satriadevs"` },
      { lang: "bash", code: `curl -o fake_dana.png -H "Content-Type: application/json" -d '{"amount":"1500000","nama":"Satriadevs"}' "https://${DOMAIN}/api/fake-dana"` },
    ],
  },
  {
    method: "GET / POST", path: "/api/wafat", badge: "PNG", badgeColor: "#d0d0d0",
    desc: "Generate kartu ucapan berita duka/wafat. Foto almarhum opsional via upload file atau URL.",
    params: [
      { name: "nama", type: "string", required: false, def: "Nama Almarhum", desc: "Nama almarhum/almarhumah, maksimal 40 karakter." },
      { name: "tanggal", type: "string", required: false, def: "—", desc: "Tanggal wafat, contoh: 12 Juni 2025." },
      { name: "foto", type: "file", required: false, def: "—", desc: "Foto almarhum (multipart/form-data)." },
      { name: "foto_url", type: "string (URL)", required: false, def: "—", desc: "URL foto almarhum, dipakai jika tidak upload file." },
    ],
    examples: [
      { lang: "bash", code: `curl -o wafat.png -F "nama=Budi Santoso" -F "tanggal=12 Juni 2025" -F "foto=@foto.jpg" "https://${DOMAIN}/api/wafat"` },
      { lang: "bash", code: `curl -o wafat.png "https://${DOMAIN}/api/wafat?nama=Budi+Santoso&tanggal=12+Juni+2025&foto_url=https://contoh.com/foto.jpg"` },
    ],
  },
  {
    method: "GET / POST", path: "/api/fake-ovo", badge: "PNG", badgeColor: "#e8c8ff",
    desc: "Generate tampilan saldo OVO.",
    params: [{ name: "amount", type: "string", required: false, def: "5000000", desc: "Nominal saldo, angka saja." }],
    examples: [{ lang: "bash", code: `curl -o fake_ovo.png "https://${DOMAIN}/api/fake-ovo?amount=5000000"` }],
  },
  {
    method: "GET / POST", path: "/api/fake-gopay", badge: "PNG", badgeColor: "#b8f0d8",
    desc: "Generate tampilan saldo dan koin GoPay.",
    params: [
      { name: "saldo", type: "string", required: false, def: "890000", desc: "Nominal saldo GoPay." },
      { name: "koin", type: "string", required: false, def: "159", desc: "Jumlah GoPay Coins." },
      { name: "terpakai", type: "string", required: false, def: "0", desc: "Nominal terpakai bulan ini." },
      { name: "bulan", type: "string", required: false, def: "Mei", desc: "Nama bulan, maksimal 20 karakter." },
    ],
    examples: [{ lang: "bash", code: `curl -o fake_gopay.png "https://${DOMAIN}/api/fake-gopay?saldo=890000&koin=159&bulan=Juni"` }],
  },
  {
    method: "GET / POST", path: "/api/fake-windows", badge: "PNG", badgeColor: "#c8d8ff",
    desc: "Generate tampilan layar error/blue screen ala Windows dengan teks kustom.",
    params: [{ name: "text", type: "string", required: true, def: "—", desc: "Teks pesan error, maksimal 200 karakter." }],
    examples: [{ lang: "bash", code: `curl -o fake_windows.png "https://${DOMAIN}/api/fake-windows?text=Sistem+sedang+sibuk"` }],
  },
  {
    method: "POST", path: "/api/fakeig", badge: "PNG", badgeColor: "#ffc8f0",
    desc: "Generate story Instagram dengan avatar dan teks.",
    params: [
      { name: "name", type: "string", required: false, def: "Someone", desc: "Username Instagram." },
      { name: "text", type: "string", required: true, def: "—", desc: "Teks caption." },
      { name: "avatar", type: "file", required: false, def: "avatar default", desc: "Foto avatar (multipart/form-data)." },
    ],
    examples: [{ lang: "bash", code: `curl -o fakeig.png -F "name=Satriadevs" -F "text=Halo!" -F "avatar=@foto.jpg" "https://${DOMAIN}/api/fakeig"` }],
  },
  {
    method: "POST", path: "/api/fakeig2", badge: "PNG", badgeColor: "#f8c8ff",
    desc: "Versi kedua Fake IG. Kata dalam tanda kurung otomatis berwarna merah, contoh: \"Ini (kata merah) biasa\".",
    params: [
      { name: "name", type: "string", required: false, def: "Someone", desc: "Username Instagram." },
      { name: "text", type: "string", required: true, def: "—", desc: "Teks caption." },
      { name: "avatar", type: "file", required: false, def: "avatar default", desc: "Foto avatar (multipart/form-data)." },
    ],
    examples: [{ lang: "bash", code: `curl -o fakeig2.png -F "name=Satriadevs" -F "text=Ini (penting) banget" -F "avatar=@foto.jpg" "https://${DOMAIN}/api/fakeig2"` }],
  },
  {
    method: "POST", path: "/api/smeme", badge: "PNG", badgeColor: "#ffd8a0",
    desc: "Generate stiker meme dengan teks atas/bawah ala Impact font.",
    params: [
      { name: "top", type: "string", required: false, def: "—", desc: "Teks bagian atas." },
      { name: "bottom", type: "string", required: false, def: "—", desc: "Teks bagian bawah." },
      { name: "image", type: "file", required: true, def: "—", desc: "Gambar dasar meme (multipart/form-data)." },
      { name: "fontsize", type: "number", required: false, def: "80", desc: "Ukuran font teks." },
    ],
    examples: [{ lang: "bash", code: `curl -o smeme.png -F "top=ATAS" -F "bottom=BAWAH" -F "image=@foto.jpg" "https://${DOMAIN}/api/smeme"` }],
  },
  {
    method: "GET / POST", path: "/api/ustadz", badge: "PNG", badgeColor: "#d8f0a0",
    desc: "Generate meme bergaya quote ustadz.",
    params: [{ name: "top", type: "string", required: true, def: "—", desc: "Teks quote." }],
    examples: [{ lang: "bash", code: `curl -o ustadz.png "https://${DOMAIN}/api/ustadz?top=Sabar+itu+indah"` }],
  },
  {
    method: "GET / POST", path: "/api/bratnime", badge: "PNG", badgeColor: "#c8ffe0",
    desc: "Generate gambar bergaya cover album minimalis dengan teks kustom.",
    params: [{ name: "text", type: "string", required: true, def: "—", desc: "Teks utama, maksimal 120 karakter." }],
    examples: [{ lang: "bash", code: `curl -o bratnime.png "https://${DOMAIN}/api/bratnime?text=satriadevs"` }],
  },
  {
    method: "GET / POST", path: "/api/bangjago", badge: "PNG", badgeColor: "#ffd8c8",
    desc: "Generate tampilan saldo Bank Jago.",
    params: [
      { name: "nama", type: "string", required: false, def: "—", desc: "Nama pemilik rekening." },
      { name: "saldo", type: "string", required: false, def: "0", desc: "Nominal saldo, angka saja." },
    ],
    examples: [{ lang: "bash", code: `curl -o bangjago.png "https://${DOMAIN}/api/bangjago?nama=Satriadevs&saldo=2500000"` }],
  },
  {
    method: "POST", path: "/api/balogo", badge: "PNG", badgeColor: "#d0c8ff",
    desc: "Generate logo dua sisi bergaya glow/rog dengan teks kiri dan kanan.",
    params: [
      { name: "left", type: "string", required: false, def: "—", desc: "Teks sisi kiri, maksimal 30 karakter." },
      { name: "right", type: "string", required: false, def: "—", desc: "Teks sisi kanan, maksimal 30 karakter." },
      { name: "transparent", type: "boolean", required: false, def: "false", desc: "Latar transparan jika true." },
    ],
    examples: [{ lang: "bash", code: `curl -o balogo.png -H "Content-Type: application/json" -d '{"left":"SATRIA","right":"DEVS"}' "https://${DOMAIN}/api/balogo"` }],
  },
  {
    method: "POST", path: "/api/pixelart", badge: "PNG", badgeColor: "#ffc8c8",
    desc: "Konversi foto menjadi gaya pixel art.",
    params: [
      { name: "image", type: "file", required: true, def: "—", desc: "Gambar sumber (multipart/form-data)." },
      { name: "level", type: "number", required: false, def: "20", desc: "Level pixelasi, 1 (halus) sampai 40 (kasar)." },
    ],
    examples: [{ lang: "bash", code: `curl -o pixelart.png -F "image=@foto.jpg" -F "level=20" "https://${DOMAIN}/api/pixelart"` }],
  },
  {
    method: "GET / POST", path: "/api/reminder", badge: "PNG", badgeColor: "#ffe8c8",
    desc: "Generate kartu pengingat dengan judul, pesan, dan waktu.",
    params: [
      { name: "title", type: "string", required: true, def: "—", desc: "Judul pengingat, maksimal 60 karakter." },
      { name: "pesan", type: "string", required: false, def: "—", desc: "Isi pesan, maksimal 300 karakter." },
      { name: "waktu", type: "string", required: false, def: "—", desc: "Waktu pengingat, maksimal 30 karakter." },
    ],
    examples: [{ lang: "bash", code: `curl -o reminder.png "https://${DOMAIN}/api/reminder?title=Minum+obat&waktu=20.00"` }],
  },
  {
    method: "GET / POST", path: "/api/quote-nokia", badge: "PNG", badgeColor: "#c8f8d8",
    desc: "Generate tampilan layar Nokia jadul dengan teks pesan.",
    params: [
      { name: "text", type: "string", required: true, def: "—", desc: "Teks pesan, maksimal 200 karakter." },
      { name: "sender", type: "string", required: false, def: "Satriadevs", desc: "Nama pengirim, maksimal 20 karakter." },
    ],
    examples: [{ lang: "bash", code: `curl -o qnokia.png "https://${DOMAIN}/api/quote-nokia?text=Halo+dari+masa+lalu&sender=Satriadevs"` }],
  },
  {
    method: "GET / POST", path: "/api/dev-card", badge: "PNG", badgeColor: "#8affa0",
    desc: "Generate kartu profil developer dengan nama, title, dan kontak telegram.",
    params: [
      { name: "name", type: "string", required: false, def: "Satriadevs", desc: "Nama developer." },
      { name: "title", type: "string", required: false, def: "developer", desc: "Jabatan/peran." },
      { name: "script", type: "string", required: false, def: "md", desc: "Bahasa/script favorit yang ditampilkan." },
      { name: "telegram", type: "string", required: false, def: "@Satriadevs", desc: "Username Telegram." },
    ],
    examples: [{ lang: "bash", code: `curl -o devcard.png "https://${DOMAIN}/api/dev-card?name=Satriadevs&title=fullstack"` }],
  },
  {
    method: "GET / POST", path: "/api/fake-motivasi", badge: "PNG", badgeColor: "#ffe8a0",
    desc: "Generate kartu kata-kata motivasi dengan nama pengarang.",
    params: [
      { name: "quote", type: "string", required: true, def: "—", desc: "Isi kutipan, maksimal 300 karakter." },
      { name: "author", type: "string", required: false, def: "Satriadevs", desc: "Nama pengarang kutipan." },
    ],
    examples: [{ lang: "bash", code: `curl -o motivasi.png "https://${DOMAIN}/api/fake-motivasi?quote=Terus+melangkah&author=Satriadevs"` }],
  },
  {
    method: "GET", path: "/api/ml-ranks", badge: "JSON", badgeColor: "#a8d0ff",
    desc: "Daftar rank, border, dan tipe lobby Mobile Legends yang tersedia untuk dipakai di /api/ml-generate.",
    params: [],
    examples: [{ lang: "bash", code: `curl "https://${DOMAIN}/api/ml-ranks"` }],
  },
  {
    method: "GET", path: "/api/lobbies", badge: "JSON", badgeColor: "#ffe066",
    desc: "Daftar 30 preview lobby Free Fire yang tersedia untuk dipakai di /fake-ff.",
    params: [],
    examples: [{ lang: "bash", code: `curl "https://${DOMAIN}/api/lobbies"` }],
  },
];

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "var(--cream)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", boxShadow: "2px 2px 0 0 var(--ink)" }}>
      <Badge color="#a8e8c9">{method}</Badge>
      <code style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{path}</code>
      <span style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 600, marginLeft: "auto" }}>{desc}</span>
    </div>
  );
}

export default function DocsPage() {
  const [ffLobbyPage, setFfLobbyPage] = useState(1);
  const FF_PER_PAGE   = 10;
  const ffTotalPages  = Math.ceil(FF_LOBBIES.length / FF_PER_PAGE);
  const visLobbies    = FF_LOBBIES.slice((ffLobbyPage - 1) * FF_PER_PAGE, ffLobbyPage * FF_PER_PAGE);

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>

        <header style={{ textAlign: "center", paddingTop: "8vh", paddingBottom: 48 }}>
          <div style={{ display: "inline-block", background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "999px", padding: "4px 18px", fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-muted)", boxShadow: "2px 2px 0 0 var(--ink)", marginBottom: 20 }}>API DOCUMENTATION</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1.1 }}>
            SatriaCanvas<span style={{ color: "var(--ink-muted)" }}> API</span>
          </h1>
          <p style={{ marginTop: 12, color: "var(--ink-muted)", fontSize: 14, fontWeight: 600 }}>
            Endpoint publik · Free Fire, Mobile Legends, IQC Image & IQC Text
          </p>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge color="#a8f0c9">GET / POST</Badge>
            <Badge color="#ffe066">Image Response</Badge>
            <Badge color="#ffc5bd">No Auth</Badge>
          </div>
        </header>

        <nav style={{ background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "var(--radius-lg)", boxShadow: "4px 4px 0 0 var(--ink)", padding: "16px 20px", marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: 10 }}>Daftar Isi</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[["#overview","Overview"],["#ff-endpoint","Endpoint FF"],["#ml-endpoint","Endpoint ML"],["#iqcimg-endpoint","Endpoint IQC Image"],["#iqctxt-endpoint","Endpoint IQC Text"],["#iqcpink-endpoint","Endpoint IQC Pink"],["#call-endpoint","Endpoint Fake Call"],["#other-endpoints","Endpoint Lainnya"],["#ttqc-endpoint","Endpoint TTQC"],["#error","Error"],["#examples","Contoh"]].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: "5px 13px", background: "var(--cream)", border: "2px solid var(--ink)", borderRadius: "999px", color: "var(--ink)", fontSize: 12, fontWeight: 700, textDecoration: "none", boxShadow: "1px 1px 0 0 var(--ink)" }}>{label}</a>
            ))}
          </div>
        </nav>

        <div id="overview">
          <SectionTitle num="01">Overview</SectionTitle>
          <Card>
            <CardHeader label="Base URL" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 10 }}>Ganti <code style={{ background: "rgba(26,26,26,0.08)", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontWeight: 800 }}>{DOMAIN}</code> dengan domain Vercel kamu.</p>
              <CodeBlock lang="text" code={`https://${DOMAIN}`} />
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <EndpointRow method="GET" path="/fake-ff" desc="Generate kartu lobby Free Fire → image/jpeg" />
                <EndpointRow method="GET" path="/fake-ml" desc="Generate kartu lobby Mobile Legends → image/png" />
                <EndpointRow method="GET / POST" path="/iqc-image" desc="Generate canvas IQC WhatsApp dengan foto → image/png" />
                <EndpointRow method="GET / POST" path="/iqc-text" desc="Generate canvas IQC WhatsApp dengan teks → image/png" />
                <EndpointRow method="GET / POST" path="/iqc-pink" desc="Generate chat bubble pink dengan reaction bar → image/png" />
                <EndpointRow method="GET / POST" path="/ttqc" desc="Generate screenshot DM bergaya TikTok → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-call" desc="Generate layar video call WhatsApp → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-dana" desc="Generate tampilan saldo DANA → image/png" />
                <EndpointRow method="GET / POST" path="/api/wafat" desc="Generate kartu ucapan berita duka → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-ovo" desc="Generate tampilan saldo OVO → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-gopay" desc="Generate tampilan saldo & koin GoPay → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-windows" desc="Generate layar error Windows → image/png" />
                <EndpointRow method="POST" path="/api/fakeig" desc="Generate story Instagram → image/png" />
                <EndpointRow method="POST" path="/api/fakeig2" desc="Generate story Instagram v2 → image/png" />
                <EndpointRow method="GET / POST" path="/api/igstory-img" desc="Generate IG story share post dengan foto & profil → image/png" />
                <EndpointRow method="GET / POST" path="/api/iqc-dark" desc="Generate chat bubble dark mode iPhone → image/png" />
                <EndpointRow method="POST" path="/api/smeme" desc="Generate stiker meme atas/bawah → image/png" />
                <EndpointRow method="GET / POST" path="/api/ustadz" desc="Generate meme quote ustadz → image/png" />
                <EndpointRow method="GET / POST" path="/api/bratnime" desc="Generate cover minimalis bertekstual → image/png" />
                <EndpointRow method="GET / POST" path="/api/bangjago" desc="Generate tampilan saldo Bank Jago → image/png" />
                <EndpointRow method="POST" path="/api/balogo" desc="Generate logo dua sisi glow/rog → image/png" />
                <EndpointRow method="POST" path="/api/pixelart" desc="Konversi foto ke pixel art → image/png" />
                <EndpointRow method="GET / POST" path="/api/reminder" desc="Generate kartu pengingat → image/png" />
                <EndpointRow method="GET / POST" path="/api/quote-nokia" desc="Generate layar Nokia jadul → image/png" />
                <EndpointRow method="GET / POST" path="/api/dev-card" desc="Generate kartu profil developer → image/png" />
                <EndpointRow method="GET / POST" path="/api/fake-motivasi" desc="Generate kartu kata motivasi → image/png" />
                <EndpointRow method="GET" path="/api/ml-ranks" desc="Daftar rank, border & lobby ML → application/json" />
                <EndpointRow method="GET" path="/api/lobbies" desc="Daftar preview lobby Free Fire → application/json" />
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,224,102,0.3)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Semua endpoint mengembalikan <strong>binary image</strong> langsung — bukan JSON. Cocok dipakai di WA Bot, Telegram Bot, cURL, atau langsung di browser.</p>
              </div>
            </div>
          </Card>
        </div>

        <div id="ff-endpoint">
          <SectionTitle num="02">Endpoint Free Fire</SectionTitle>
          <Card>
            <CardHeader label="GET /fake-ff" badge="JPEG" badgeColor="#ffe066" />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/fake-ff?usr={username}&lobby={1-30}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="usr" type="string" required def="—" desc="Username yang tampil di kartu, maksimal 20 karakter." />
                    <ParamRow name="lobby" type="number" required={false} def="random" desc="Nomor background lobby (1–30). Kosongkan untuk random." />
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/jpeg"],["Content-Disposition","inline; filename=\"ff-{username}-lobby{n}.jpg\""],["X-Username","username yang digunakan"],["X-Lobby","nomor lobby yang digunakan"],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o ff_card.jpg "https://${DOMAIN}/fake-ff?usr=Satriadevs&lobby=5"`} />
            </div>
          </Card>
          <Card>
            <CardHeader label="Daftar Lobby FF" badge="30 lobby" badgeColor="#ffe066" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                <thead><tr>{["No","Preview","Nilai Parameter"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {visLobbies.map((lb, i) => (
                    <tr key={lb.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.1)", background: i % 2 === 0 ? "var(--paper)" : "var(--cream)" }}>
                      <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 800, color: "var(--ink-muted)" }}>{String(lb.id).padStart(2,"0")}</td>
                      <td style={{ padding: "6px 14px" }}>
                        <div style={{ width: 110, height: 62, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "2px solid rgba(26,26,26,0.2)", boxShadow: "1px 1px 0 0 var(--ink)" }}>
                          <img src={lb.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
                        </div>
                      </td>
                      <td style={{ padding: "8px 14px" }}><code style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, background: "rgba(26,26,26,0.07)", padding: "3px 8px", borderRadius: 4 }}>lobby={lb.id}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ffTotalPages > 1 && (
              <div style={{ padding: "12px 20px", borderTop: "2px solid var(--ink)", display: "flex", justifyContent: "center", gap: 6, background: "rgba(26,26,26,0.02)" }}>
                <button onClick={() => setFfLobbyPage(p => Math.max(1, p - 1))} disabled={ffLobbyPage === 1} style={{ padding: "5px 12px", background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, cursor: ffLobbyPage === 1 ? "not-allowed" : "pointer", opacity: ffLobbyPage === 1 ? 0.4 : 1, boxShadow: "1px 1px 0 0 var(--ink)", color: "var(--ink)" }}>‹ PREV</button>
                {Array.from({ length: ffTotalPages }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setFfLobbyPage(p)} style={{ width: 30, height: 28, background: p === ffLobbyPage ? "var(--ink)" : "var(--paper)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", color: p === ffLobbyPage ? "var(--paper)" : "var(--ink-muted)", fontSize: 11, fontWeight: 800, cursor: "pointer", boxShadow: p === ffLobbyPage ? "none" : "1px 1px 0 0 var(--ink)" }}>{p}</button>)}
                <button onClick={() => setFfLobbyPage(p => Math.min(ffTotalPages, p + 1))} disabled={ffLobbyPage === ffTotalPages} style={{ padding: "5px 12px", background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 700, cursor: ffLobbyPage === ffTotalPages ? "not-allowed" : "pointer", opacity: ffLobbyPage === ffTotalPages ? 0.4 : 1, boxShadow: "1px 1px 0 0 var(--ink)", color: "var(--ink)" }}>NEXT ›</button>
              </div>
            )}
          </Card>
        </div>

        <div id="ml-endpoint">
          <SectionTitle num="03">Endpoint Mobile Legends</SectionTitle>
          <Card>
            <CardHeader label="GET /fake-ml" badge="PNG" badgeColor="#c9a9f0" />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/fake-ml?usr={username}&rank={rank_key}&border={0-16}&lobby_type={jp|indo}&avatar={url}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="usr" type="string" required def="—" desc="Username player, maksimal 15 karakter." />
                    <ParamRow name="rank" type="string" required={false} def="imo" desc="Key rank. Lihat tabel di bawah." />
                    <ParamRow name="border" type="number" required={false} def="0" desc="Nomor border avatar (0–16). Isi 0 atau kosongkan untuk tanpa border (outline default emas)." />
                    <ParamRow name="lobby_type" type="string" required={false} def="jp" desc="Tipe background lobby. jp = Lobby Jepang, indo = Lobby Indo." />
                    <ParamRow name="avatar" type="string (URL)" required={false} def="default" desc="URL foto avatar. Harus diawali https://." />
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"ml-{username}-{rank}.png\""],["X-Username","username"],["X-Rank","rank"],["X-Border","border"],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o ml.png "https://${DOMAIN}/fake-ml?usr=Satriadevs&rank=legend&border=3&lobby_type=jp"`} />
              <CodeBlock lang="bash" code={`curl -o ml_indo.png "https://${DOMAIN}/fake-ml?usr=Satriadevs&rank=imo&lobby_type=indo"`} />
            </div>
          </Card>
          <Card>
            <CardHeader label="Daftar Rank ML" badge="7 rank" badgeColor="#c9a9f0" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                <thead><tr>{["Key (rank=)","Icon","Nama Rank","Warna"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {ML_RANKS.map((r, i) => (
                    <tr key={r.key} style={{ borderBottom: "1px solid rgba(26,26,26,0.1)", background: i % 2 === 0 ? "var(--paper)" : "var(--cream)" }}>
                      <td style={{ padding: "10px 14px" }}><code style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800, background: "rgba(26,26,26,0.07)", padding: "3px 8px", borderRadius: 4 }}>rank={r.key}</code></td>
                      <td style={{ padding: "8px 14px" }}><img src={`/ml/rank/${r.key}.webp`} alt={r.label} style={{ width: 36, height: 36, objectFit: "contain" }} draggable={false} /></td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: r.color }}>{r.label}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: r.color, border: "2px solid var(--ink)", flexShrink: 0 }} />
                          <code style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--ink-soft)" }}>{r.color}</code>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader label="Daftar Border ML" badge="16 border" badgeColor="#a8d0f0" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
                <thead><tr>{["No","Preview","Nilai Parameter"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {ML_BORDERS.map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.1)", background: i % 2 === 0 ? "var(--paper)" : "var(--cream)" }}>
                      <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 800, color: "var(--ink-muted)" }}>{String(b.id).padStart(2,"0")}</td>
                      <td style={{ padding: "7px 14px" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "2px solid rgba(26,26,26,0.2)", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "1px 1px 0 0 var(--ink)" }}>
                          <img src={b.img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} draggable={false} />
                        </div>
                      </td>
                      <td style={{ padding: "8px 14px" }}><code style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, background: "rgba(26,26,26,0.07)", padding: "3px 8px", borderRadius: 4 }}>border={b.id}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div id="iqcimg-endpoint">
          <SectionTitle num="04">Endpoint IQC Image</SectionTitle>
          <Card>
            <CardHeader label="GET  /iqc-image" badge="PNG" badgeColor="#b8f0b8" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Generate canvas bergaya screenshot WhatsApp dengan foto, nama, dan waktu. Background dari aset lokal <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(26,26,26,0.07)", padding: "1px 5px", borderRadius: 3 }}>bg.jpg</code>.</p>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint (GET)</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/iqc-image?nama={nama}&waktu={waktu}&photo_url={url}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query (GET)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="nama" type="string" required def="—" desc="Nama pengirim. Tampil di area atas dan bawah canvas. Maks 25 karakter." />
                    <ParamRow name="waktu" type="string" required def="—" desc="Waktu pesan, contoh: 13.56. Tampil di area tengah canvas." />
                    <ParamRow name="photo_url" type="string (URL)" required={false} def="kosong" desc="URL foto untuk slot foto canvas. Harus diawali https://." />
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(168,240,168,0.3)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Untuk kirim foto dari file (bukan URL), pakai metode <strong>POST multipart/form-data</strong> dengan field <code style={{ fontFamily: "monospace" }}>photo</code>.</p>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Form (POST multipart)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Field","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="nama" type="string" required def="—" desc="Nama pengirim, maks 25 karakter." />
                    <ParamRow name="waktu" type="string" required def="—" desc="Waktu pesan, contoh: 13.56." />
                    <ParamRow name="photo" type="file (image/*)" required={false} def="kosong" desc="File gambar untuk foto. Lebih prioritas dari photo_url." />
                    <ParamRow name="photo_url" type="string (URL)" required={false} def="kosong" desc="URL foto. Digunakan jika field photo tidak ada." />
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"iqc-image-{nama}.png\""],["X-Nama","nama yang digunakan"],["X-Waktu","waktu yang digunakan"],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o iqc_image.png "https://${DOMAIN}/iqc-image?nama=Satriadevs&waktu=13.56&photo_url=https://i.imgur.com/abc.jpg"`} />
              <CodeBlock lang="bash" code={`curl -o iqc_image.png -F "nama=Satriadevs" -F "waktu=13.56" -F "photo=@/path/to/photo.jpg" "https://${DOMAIN}/iqc-image"`} />
            </div>
          </Card>
        </div>

        <div id="iqctxt-endpoint">
          <SectionTitle num="05">Endpoint IQC Text</SectionTitle>
          <Card>
            <CardHeader label="GET  /iqc-text" badge="PNG" badgeColor="#f0c8ff" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Generate screenshot chat WhatsApp dengan teks pesan, waktu, dan status bar (sinyal, wifi, baterai). Mendukung emoji yang otomatis dirender sebagai gambar.</p>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint (GET)</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/iqc-text?text={teks}&time={waktu}&baterai=true&bat_level=100&operator=true&timebar=true&wifi=true`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query (GET)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="text" type="string" required def="—" desc="Teks pesan. Mendukung emoji langsung di teks." />
                    <ParamRow name="time" type="string" required def="—" desc="Waktu pesan, contoh: 13.56." />
                    <ParamRow name="baterai" type="boolean" required={false} def="true" desc="Tampilkan ikon baterai di status bar." />
                    <ParamRow name="bat_level" type="string" required={false} def="100" desc="Level baterai dalam persen (0–100)." />
                    <ParamRow name="operator" type="boolean" required={false} def="true" desc="Tampilkan sinyal operator di status bar." />
                    <ParamRow name="timebar" type="boolean" required={false} def="true" desc="Tampilkan waktu di kiri status bar." />
                    <ParamRow name="wifi" type="boolean" required={false} def="true" desc="Tampilkan ikon wifi di status bar." />
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Body JSON (POST)</div>
              <CodeBlock lang="json" code={`{
  "text": "Halo kak, udah makan belum? 😊",
  "time": "13.56",
  "baterai": [true, "80"],
  "operator": true,
  "timebar": true,
  "wifi": true
}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"iqc-text-{timestamp}.png\""],["X-Text","teks (URL-encoded, 50 char pertama)"],["X-Time","waktu yang digunakan"],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o iqc_text.png "https://${DOMAIN}/iqc-text?text=Halo+kak&time=13.56"`} />
              <CodeBlock lang="bash" code={`curl -o iqc_text.png "https://${DOMAIN}/iqc-text?text=Selamat+pagi+☀️&time=07.30&baterai=true&bat_level=90&wifi=false"`} />
            </div>
          </Card>
        </div>

        <div id="iqcpink-endpoint">
          <SectionTitle num="06">Endpoint IQC Pink</SectionTitle>
          <Card>
            <CardHeader label="GET / POST  /api/iqc-pink" badge="PNG" badgeColor="#ffb8d8" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Chat bubble bergaya pink dengan reaction bar (emoji warna asli, bukan ikon flat). Avatar memakai foto default bawaan, tidak ada upload foto.</p>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint (GET)</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/api/iqc-pink?text={teks}&time={waktu}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query (GET)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="text" type="string" required def="—" desc="Teks pesan yang tampil di chat bubble. Maksimal 200 karakter." />
                    <ParamRow name="time" type="string" required={false} def="00.00" desc="Waktu pesan, contoh: 22.54." />
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,184,216,0.3)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Body POST memakai <strong>application/json</strong> dengan field <code style={{ fontFamily: "monospace" }}>text</code> dan <code style={{ fontFamily: "monospace" }}>time</code>.</p>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"iqc-pink.png\""],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o iqc_pink.png "https://${DOMAIN}/api/iqc-pink?text=Kesendirian+adalah+teman+terbaik+ku&time=22.54"`} />
              <CodeBlock lang="bash" code={`curl -o iqc_pink.png -H "Content-Type: application/json" -d '{"text":"Halo kak","time":"09.15"}' "https://${DOMAIN}/api/iqc-pink"`} />
            </div>
          </Card>
        </div>

        <div id="call-endpoint">
          <SectionTitle num="06b">Endpoint Fake Call</SectionTitle>
          <Card>
            <CardHeader label="GET / POST  /api/fake-call" badge="PNG" badgeColor="#d8d8ff" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Layar video call WhatsApp asli lengkap dengan tombol kontrol panggilan. Avatar opsional lewat upload file atau URL.</p>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint (GET)</div>
              <CodeBlock lang="text" code={`GET https://${DOMAIN}/api/fake-call?name={nama}&duration={durasi}&avatar_url={url}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query (GET)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="name" type="string" required def="—" desc="Nama kontak yang tampil di layar panggilan. Maksimal 30 karakter." />
                    <ParamRow name="duration" type="string" required={false} def="00.00" desc="Teks durasi/waktu panggilan, contoh: 19.45." />
                    <ParamRow name="avatar_url" type="string (URL)" required={false} def="avatar default" desc="URL foto avatar. Harus diawali https://." />
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(216,216,255,0.3)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Untuk upload avatar dari file, pakai metode <strong>POST multipart/form-data</strong> dengan field <code style={{ fontFamily: "monospace" }}>avatar</code> menggantikan <code style={{ fontFamily: "monospace" }}>avatar_url</code>.</p>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"fake-call.png\""],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o fake_call.png "https://${DOMAIN}/api/fake-call?name=Mama&duration=19.45"`} />
              <CodeBlock lang="bash" code={`curl -o fake_call.png -F "name=Mama" -F "duration=19.45" -F "avatar=@foto.jpg" "https://${DOMAIN}/api/fake-call"`} />
            </div>
          </Card>
        </div>

        <div id="other-endpoints">
          <SectionTitle num="06c">Endpoint Lainnya</SectionTitle>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 16 }}>Endpoint lain tersedia langsung di <code style={{ fontFamily: "monospace" }}>/api/[nama]</code>, masing-masing punya route file sendiri. Semua mengembalikan <strong>image/png</strong> atau <strong>image/jpeg</strong>, kecuali disebutkan lain.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {OTHER_ENDPOINTS.map(ep => <MiniEndpoint key={ep.path} {...ep} />)}
          </div>
        </div>

        <div id="ttqc-endpoint">
          <SectionTitle num="07">Endpoint TTQC</SectionTitle>
          <Card>
            <CardHeader label="GET / POST  /ttqc" badge="PNG" badgeColor="#c8c8c8" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Screenshot DM bergaya TikTok lengkap dengan menu konteks (Balas, Teruskan, Salin, dll). Avatar opsional lewat upload file atau URL.</p>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Endpoint (GET)</div>

              <CodeBlock lang="text" code={`GET https://${DOMAIN}/ttqc?username={nama}&text={teks}&avatar_url={url}`} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Parameter Query (GET)</div>
              <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Parameter","Tipe","Default","Deskripsi"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    <ParamRow name="username" type="string" required={false} def="Satriadevs" desc="Nama pengguna yang tampil di header chat. Maksimal 30 karakter." />
                    <ParamRow name="text" type="string" required def="—" desc="Teks pesan yang tampil di bubble chat. Maksimal 150 karakter." />
                    <ParamRow name="avatar_url" type="string (URL)" required={false} def="avatar default" desc="URL foto avatar. Harus diawali https://." />
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(200,200,200,0.3)", border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Untuk upload avatar dari file (bukan URL), pakai metode <strong>POST multipart/form-data</strong> dengan field <code style={{ fontFamily: "monospace" }}>avatar</code> menggantikan <code style={{ fontFamily: "monospace" }}>avatar_url</code>.</p>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Response Header</div>
              <RespHeaderTable rows={[["Content-Type","image/png"],["Content-Disposition","inline; filename=\"ttqc.png\""],["Cache-Control","no-store"]]} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8, marginTop: 20 }}>Contoh</div>
              <CodeBlock lang="bash" code={`curl -o ttqc.png "https://${DOMAIN}/ttqc?username=Satriadevs&text=Just+friend+kok+cemburu+sih"`} />
              <CodeBlock lang="bash" code={`curl -o ttqc.png -F "username=Satriadevs" -F "text=Halo kak" -F "avatar=@foto.jpg" "https://${DOMAIN}/ttqc"`} />
            </div>
          </Card>
        </div>

        <div id="error">
          <SectionTitle num="08">Error Response</SectionTitle>
          <Card>
            <CardHeader label="Format Error" badge="JSON" badgeColor="#ffb5a0" />
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 12 }}>Kalau ada yang salah, server balas JSON dengan status code yang sesuai — bukan gambar.</p>
              <CodeBlock lang="json" code={`{ "error": "Parameter 'usr' wajib diisi", "example": "/fake-ff?usr=PlayerName&lobby=1" }`} />
              <div style={{ marginTop: 16, border: "2px solid var(--ink)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "2px 2px 0 0 var(--ink)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["HTTP Status","Penyebab"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[["400 Bad Request","Parameter wajib tidak diisi atau nilainya tidak valid"],["500 Internal Server Error","Ada error di server saat memproses canvas"]].map(([s, d], i) => (
                      <tr key={s} style={{ borderBottom: "1px solid rgba(26,26,26,0.1)", background: i % 2 === 0 ? "var(--paper)" : "var(--cream)" }}>
                        <td style={{ padding: "10px 14px" }}><code style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, color: i === 0 ? "#c0392b" : "#7f3faa" }}>{s}</code></td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <div id="examples">
          <SectionTitle num="09">Contoh Penggunaan</SectionTitle>
          <Card>
            <CardHeader label="cURL" badge="Terminal" badgeColor="#ffe066" />
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Free Fire", `curl -o ff.jpg "https://${DOMAIN}/fake-ff?usr=Satriadevs&lobby=12"`],
                ["Mobile Legends", `curl -o ml.png "https://${DOMAIN}/fake-ml?usr=Satria&rank=legend&border=5"`],
                ["IQC Image (URL foto)", `curl -o iqc_img.png "https://${DOMAIN}/iqc-image?nama=Satriadevs&waktu=13.56&photo_url=https://i.imgur.com/abc.jpg"`],
                ["IQC Image (upload foto)", `curl -o iqc_img.png -F "nama=Satriadevs" -F "waktu=13.56" -F "photo=@foto.jpg" "https://${DOMAIN}/iqc-image"`],
                ["IQC Text", `curl -o iqc_txt.png "https://${DOMAIN}/iqc-text?text=Halo+kak&time=13.56"`],
              ].map(([label, code]) => (
                <div key={label}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-muted)", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
                  <CodeBlock lang="bash" code={code} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader label="Node.js / Baileys (WhatsApp Bot)" badge="WA Bot" badgeColor="#a8e8c9" />
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <CodeBlock lang="javascript" code={`const axios = require("axios");

async function sendCard(sock, jid, url, caption) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await sock.sendMessage(jid, { image: Buffer.from(res.data), caption });
}

sendCard(sock, jid, \`https://${DOMAIN}/fake-ff?usr=Satriadevs&lobby=5\`, "FF Card");
sendCard(sock, jid, \`https://${DOMAIN}/fake-ml?usr=Satria&rank=imo\`, "ML Card");
sendCard(sock, jid, \`https://${DOMAIN}/iqc-text?text=Halo+kak&time=13.56\`, "IQC Text");
sendCard(sock, jid, \`https://${DOMAIN}/iqc-image?nama=Satria&waktu=13.56\`, "IQC Image");`} />
            </div>
          </Card>

          <Card>
            <CardHeader label="Python (requests)" badge="Python" badgeColor="#a8d0f0" />
            <div style={{ padding: 20 }}>
              <CodeBlock lang="python" code={`import requests

BASE = "https://${DOMAIN}"

def get_card(endpoint, params):
    res = requests.get(f"{BASE}/{endpoint}", params=params)
    if res.status_code == 200:
        return res.content
    return None

ff_img  = get_card("fake-ff",   {"usr": "Satriadevs", "lobby": 5})
ml_img  = get_card("fake-ml",   {"usr": "Satria", "rank": "legend", "border": 3})
iqc_txt = get_card("iqc-text",  {"text": "Halo kak", "time": "13.56"})
iqc_img = get_card("iqc-image", {"nama": "Satriadevs", "waktu": "13.56",
                                  "photo_url": "https://i.imgur.com/abc.jpg"})`} />
            </div>
          </Card>

          <Card>
            <CardHeader label="JavaScript / Fetch (Browser)" badge="JS" badgeColor="#ffe066" />
            <div style={{ padding: 20 }}>
              <CodeBlock lang="javascript" code={`async function getCard(endpoint, params) {
  const q   = new URLSearchParams(params);
  const res = await fetch(\`https://${DOMAIN}/\${endpoint}?\${q}\`);
  if (!res.ok) throw new Error("Gagal");
  return URL.createObjectURL(await res.blob());
}

const ffUrl  = await getCard("fake-ff",   { usr: "Satriadevs", lobby: 5 });
const mlUrl  = await getCard("fake-ml",   { usr: "Satria", rank: "legend" });
const txtUrl = await getCard("iqc-text",  { text: "Halo kak", time: "13.56" });
const imgUrl = await getCard("iqc-image", { nama: "Satriadevs", waktu: "13.56" });`} />
            </div>
          </Card>
        </div>

        <footer style={{ textAlign: "center", paddingTop: 32, paddingBottom: 16 }}>
          <div style={{ display: "inline-block", padding: "10px 24px", background: "var(--paper)", border: "2px solid var(--ink)", borderRadius: "999px", boxShadow: "2px 2px 0 0 var(--ink)" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>SatriaCanvas API Docs</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}>← Kembali ke Generator</a>
          </div>
        </footer>

      </div>
    </main>
  );
}
