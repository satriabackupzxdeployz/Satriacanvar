"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Tab = "ff"|"ml"|"iqcimg"|"iqctxt"|"iqcpink"|"ttqc"|"devcard"|"fakewin"|"gopay"|"ovo"|"motivasi"|"pixel"
         |"smeme"|"ustadz"|"bratnime"|"bangjago"|"balogo"|"fakeig"|"fakeig2"|"wafat"|"reminder"|"qnokia"|"dana"|"call"|"igstory"|"iqcdark";

type LobbyItem  = { id: number; img: string };
type RankItem   = { key: string; label: string; color: string };
type BorderItem = { id: number; img: string };
type GenResult  = { image: string; username?: string; nama?: string; lobby?: number; rank?: string; border?: number };

const I = {
  ff:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ml:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
  img:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  txt:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  dl:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0-4-4m4 4 4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chev:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  star:  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  chk:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  upl:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  dev:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  win:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  gp:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ovo:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/></svg>,
  mot:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17.3l-6.2 4.5 2.4-7.3L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  pix:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="4" height="4" rx="0.5" fill="currentColor"/><rect x="11" y="3" width="4" height="4" rx="0.5" fill="currentColor"/><rect x="3" y="11" width="4" height="4" rx="0.5" fill="currentColor"/><rect x="11" y="11" width="4" height="4" rx="0.5" fill="currentColor"/><rect x="7" y="7" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5"/></svg>,
  cam:   <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  meme:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>,
  ust:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>,
  brat:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  bang:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  logo:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
  ig:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
  rip:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  rmd:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  nok:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="18" r="1" fill="currentColor"/><path d="M9 6h6M9 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  dana:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14H11v-4H9l3-5 3 5h-2v4z" fill="currentColor"/></svg>,
  call:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.95.36 1.88.68 2.78a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.32 1.83.55 2.78.68A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  igstory: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
  iqcdark: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  pink:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 8.5c0 4.5-8 10.5-8 10.5S4 13 4 8.5A4.5 4.5 0 0112 5a4.5 4.5 0 018 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  tt:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M16 3a5 5 0 005 5M16 3v12a4 4 0 11-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const GROUPS = [
  {
    label: "Game",
    tabs: [
      { key:"ff"      as const, label:"Free Fire",      icon:I.ff,   accent:"#ffd166" },
      { key:"ml"      as const, label:"Mobile Legends", icon:I.ml,   accent:"#90c2ff" },
    ],
  },
  {
    label: "IQC",
    tabs: [
      { key:"iqcimg"  as const, label:"IQC Image",      icon:I.img,     accent:"#b8f0b8" },
      { key:"iqctxt"  as const, label:"IQC Text",       icon:I.txt,     accent:"#f0c8ff" },
      { key:"iqcpink" as const, label:"IQC Pink",       icon:I.pink,    accent:"#ffb8d8" },
      { key:"iqcdark" as const, label:"IQC Dark",       icon:I.iqcdark, accent:"#c8d8ff" },
      { key:"ttqc"    as const, label:"TTQC",           icon:I.tt,      accent:"#c8c8c8" },
    ],
  },
  {
    label: "Canvas",
    tabs: [
      { key:"devcard" as const, label:"Dev Card",       icon:I.dev,  accent:"#8affa0" },
      { key:"fakewin" as const, label:"Fake Windows",   icon:I.win,  accent:"#c8d8ff" },
      { key:"gopay"   as const, label:"Fake GoPay",     icon:I.gp,   accent:"#b8f0d8" },
      { key:"ovo"     as const, label:"Fake OVO",       icon:I.ovo,  accent:"#e8c8ff" },
      { key:"dana"    as const, label:"Fake DANA",      icon:I.dana, accent:"#b8d8ff" },
      { key:"call"    as const, label:"Fake Call",      icon:I.call, accent:"#d8d8ff" },
      { key:"motivasi"as const, label:"Motivasi",       icon:I.mot,  accent:"#ffe8a0" },
      { key:"smeme"   as const, label:"Stiker Meme",    icon:I.meme, accent:"#ffd8a0" },
      { key:"ustadz"  as const, label:"Ustadz Meme",    icon:I.ust,  accent:"#d8f0a0" },
      { key:"bratnime"as const, label:"Brat Anime",     icon:I.brat, accent:"#c8ffe0" },
      { key:"bangjago"as const, label:"BangJago Saldo", icon:I.bang, accent:"#ffd8c8" },
      { key:"balogo"  as const, label:"BA Logo",        icon:I.logo, accent:"#d0c8ff" },
      { key:"fakeig"  as const, label:"Fake IG",        icon:I.ig,   accent:"#ffc8f0" },
      { key:"fakeig2" as const, label:"Fake IG v2",     icon:I.ig,      accent:"#f8c8ff" },
      { key:"igstory" as const, label:"IG Story IMG",    icon:I.igstory, accent:"#ffd8f0" },
      { key:"wafat"   as const, label:"Ucapan Wafat",    icon:I.rip,     accent:"#d0d0d0" },
      { key:"reminder"as const, label:"Reminder",       icon:I.rmd,  accent:"#ffe8c8" },
      { key:"qnokia"  as const, label:"Quote Nokia",    icon:I.nok,  accent:"#c8f8d8" },
      { key:"pixel"   as const, label:"Pixel Art",      icon:I.pix,  accent:"#ffc8c8" },
    ],
  },
];

const ACCENTS: Record<Tab,string> = {
  ff:"rgba(255,209,102,0.35)", ml:"rgba(168,208,240,0.35)", iqcimg:"rgba(168,240,168,0.35)",
  iqctxt:"rgba(240,200,255,0.35)", iqcpink:"rgba(255,184,216,0.35)", ttqc:"rgba(200,200,200,0.35)", devcard:"rgba(138,255,160,0.25)", fakewin:"rgba(200,216,255,0.35)",
  gopay:"rgba(184,240,216,0.35)", ovo:"rgba(232,200,255,0.35)", dana:"rgba(184,216,255,0.35)", call:"rgba(216,216,255,0.35)",
  igstory:"rgba(255,216,240,0.35)", iqcdark:"rgba(200,216,255,0.35)",
  motivasi:"rgba(255,232,160,0.35)", smeme:"rgba(255,216,160,0.35)", ustadz:"rgba(216,240,160,0.35)",
  bratnime:"rgba(200,255,224,0.35)", bangjago:"rgba(255,216,200,0.35)", balogo:"rgba(208,200,255,0.35)",
  fakeig:"rgba(255,200,240,0.35)", fakeig2:"rgba(248,200,255,0.35)", wafat:"rgba(208,208,208,0.35)",
  reminder:"rgba(255,232,200,0.35)", qnokia:"rgba(200,248,216,0.35)", pixel:"rgba(255,200,200,0.35)",
};

function Sk({ w, h, style }: { w?: string|number; h?: string|number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w ?? "100%", height: h ?? 20, ...style }} />;
}

export default function Home() {
  const [tab, setTab]               = useState<Tab>("ff");
  const [ffLobbies, setFfLobbies]   = useState<LobbyItem[]>([]);
  const [mlRanks, setMlRanks]       = useState<RankItem[]>([]);
  const [mlBorders, setMlBorders]   = useState<BorderItem[]>([]);
  const [mlLobbyTypes,setMlLobbyTypes]=useState<{key:string;label:string}[]>([]);
  const [dataLoading,setDataLoading]=useState(true);
  const [ffUsername,setFfUsername]  =useState("");
  const [ffLobby,setFfLobby]        =useState<number|null>(null);
  const [ffPage,setFfPage]          =useState(1);
  const [mlUsername,setMlUsername]  =useState("");
  const [mlRank,setMlRank]          =useState("imo");
  const [mlBorder,setMlBorder]      =useState(0);
  const [mlAvatarUrl,setMlAvatarUrl]=useState("");
  const [mlLobbyType,setMlLobbyType]=useState("jp");
  const [mlBorderPage,setMlBorderPage]=useState(1);
  const [iqcNama,setIqcNama]        =useState("");
  const [iqcWaktu,setIqcWaktu]      =useState("");
  const [iqcPhotoFile,setIqcPhotoFile]=useState<File|null>(null);
  const [iqcPhotoUrl,setIqcPhotoUrl]=useState("");
  const [iqcPhotoMode,setIqcPhotoMode]=useState<"upload"|"url">("upload");
  const [iqcPreview,setIqcPreview]  =useState("");
  const [iqcText,setIqcText]        =useState("");
  const [iqcTime,setIqcTime]        =useState("");
  const [iqcBaterai,setIqcBaterai]  =useState(true);
  const [iqcBatLevel,setIqcBatLevel]=useState("100");
  const [iqcOperator,setIqcOperator]=useState(true);
  const [iqcTimebar,setIqcTimebar]  =useState(true);
  const [iqcWifi,setIqcWifi]        =useState(true);
  const [pinkText,setPinkText]      =useState("");
  const [pinkTime,setPinkTime]      =useState("");
  const [ttUsername,setTtUsername] =useState("");
  const [ttText,setTtText]         =useState("");
  const [ttAvFile,setTtAvFile]     =useState<File|null>(null);
  const [ttAvPreview,setTtAvPreview]=useState("");
  const [devName,setDevName]        =useState("");
  const [devTitle,setDevTitle]      =useState("");
  const [devScript,setDevScript]    =useState("");
  const [devTelegram,setDevTelegram]=useState("");
  const [winText,setWinText]        =useState("");
  const [gopSaldo,setGopSaldo]      =useState("");
  const [gopKoin,setGopKoin]        =useState("");
  const [gopTerpakai,setGopTerpakai]=useState("");
  const [gopBulan,setGopBulan]      =useState("");
  const [ovoAmount,setOvoAmount]    =useState("");
  const [danaAmount,setDanaAmount]  =useState("");
  const [danaNama,setDanaNama]      =useState("");
  const [callName,setCallName]        =useState("");
  const [callDuration,setCallDuration]=useState("");
  const [callAvFile,setCallAvFile]    =useState<File|null>(null);
  const [callAvPreview,setCallAvPreview]=useState("");
  const [igstoryNama,setIgstoryNama]  =useState("");
  const [igstoryUser,setIgstoryUser]  =useState("");
  const [igstoryFotoFile,setIgstoryFotoFile]=useState<File|null>(null);
  const [igstoryFotoPreview,setIgstoryFotoPreview]=useState("");
  const [igstoryFotoUrl,setIgstoryFotoUrl]=useState("");
  const [igstoryPpFile,setIgstoryPpFile]=useState<File|null>(null);
  const [igstoryPpPreview,setIgstoryPpPreview]=useState("");
  const [igstoryPpUrl,setIgstoryPpUrl]=useState("");
  const [darkTime,setDarkTime]        =useState("");
  const [darkText,setDarkText]        =useState("");
  const [darkImgFile,setDarkImgFile]  =useState<File|null>(null);
  const [darkImgPreview,setDarkImgPreview]=useState("");
  const [darkImgUrl,setDarkImgUrl]    =useState("");
  const [motQuote,setMotQuote]      =useState("");
  const [motAuthor,setMotAuthor]    =useState("");
  const [smTop,setSmTop]            =useState("");
  const [smBot,setSmBot]            =useState("");
  const [smFile,setSmFile]          =useState<File|null>(null);
  const [smPreview,setSmPreview]    =useState("");
  const [smFontSize,setSmFontSize]  =useState(80);
  const [ustText,setUstText]        =useState("");
  const [bratText,setBratText]      =useState("");
  const [bangNama,setBangNama]      =useState("");
  const [bangSaldo,setBangSaldo]    =useState("");
  const [baLeft,setBaLeft]          =useState("");
  const [baRight,setBaRight]        =useState("");
  const [baTransparent,setBaTransparent]=useState(false);
  const [igName,setIgName]          =useState("");
  const [igText,setIgText]          =useState("");
  const [igAvFile,setIgAvFile]      =useState<File|null>(null);
  const [igAvPreview,setIgAvPreview]=useState("");
  const [ig2Name,setIg2Name]        =useState("");
  const [ig2Text,setIg2Text]        =useState("");
  const [ig2AvFile,setIg2AvFile]    =useState<File|null>(null);
  const [ig2AvPreview,setIg2AvPreview]=useState("");
  const [wafatNama,setWafatNama]    =useState("");
  const [wafatTgl,setWafatTgl]      =useState("");
  const [wafatPesan,setWafatPesan]  =useState("");
  const [wafatFoto,setWafatFoto]    =useState<File|null>(null);
  const [wafatPreview,setWafatPreview]=useState("");
  const [rmdTitle,setRmdTitle]      =useState("");
  const [rmdPesan,setRmdPesan]      =useState("");
  const [rmdWaktu,setRmdWaktu]      =useState("");
  const [nokText,setNokText]        =useState("");
  const [nokSender,setNokSender]    =useState("");
  const [pixFile,setPixFile]        =useState<File|null>(null);
  const [pixPreview,setPixPreview]  =useState("");
  const [pixLevel,setPixLevel]      =useState(20);
  const [loading,setLoading]        =useState(false);
  const [result,setResult]          =useState<GenResult|null>(null);
  const [resultBlob,setResultBlob]  =useState("");
  const [err,setErr]                =useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const block=(e:Event)=>e.preventDefault();
    const bk=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&["s","u","c","a"].includes(e.key.toLowerCase()))e.preventDefault();
      if(e.key==="F12"||(e.ctrlKey&&e.shiftKey&&["i","j"].includes(e.key.toLowerCase())))e.preventDefault();
    };
    document.addEventListener("contextmenu",block);document.addEventListener("keydown",bk);
    return()=>{document.removeEventListener("contextmenu",block);document.removeEventListener("keydown",bk);};
  },[]);

  useEffect(()=>{
    setDataLoading(true);
    Promise.all([fetch("/api/lobbies").then(r=>r.json()),fetch("/api/ml-ranks").then(r=>r.json())])
      .then(([ff,ml])=>{setFfLobbies(ff.lobbies??[]);setMlRanks(ml.ranks??[]);setMlBorders(ml.borders??[]);setMlLobbyTypes(ml.lobbyTypes??[]);})
      .finally(()=>setDataLoading(false));
  },[]);

  const chgTab=useCallback((t:Tab)=>{setTab(t);setResult(null);setResultBlob("");setErr("");},[]);

  async function blobRes(res:Response){
    if(!res.ok){const d=await res.json();setErr(d.error||"Gagal generate");return;}
    const blob=await res.blob();const url=URL.createObjectURL(blob);
    setResultBlob(url);setResult({image:url});
    setTimeout(()=>outputRef.current?.scrollIntoView({behavior:"smooth"}),80);
  }

  const genFF=useCallback(async()=>{
    if(!ffUsername.trim()){setErr("Username wajib diisi!");return;}
    setErr("");setLoading(true);setResult(null);setResultBlob("");
    try{const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:ffUsername.trim(),lobby:ffLobby})});
      const d=await res.json();if(!res.ok)setErr(d.error||"Error");else{setResult(d);setTimeout(()=>outputRef.current?.scrollIntoView({behavior:"smooth"}),80);}
    }catch{setErr("Koneksi error");}finally{setLoading(false);}
  },[ffUsername,ffLobby]);

  const genML=useCallback(async()=>{
    if(!mlUsername.trim()){setErr("Username wajib diisi!");return;}
    setErr("");setLoading(true);setResult(null);setResultBlob("");
    try{const res=await fetch("/api/ml-generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:mlUsername.trim(),rank:mlRank,border:mlBorder,avatar:mlAvatarUrl||undefined,lobby_type:mlLobbyType})});
      const d=await res.json();if(!res.ok)setErr(d.error||"Error");else{setResult(d);setTimeout(()=>outputRef.current?.scrollIntoView({behavior:"smooth"}),80);}
    }catch{setErr("Koneksi error");}finally{setLoading(false);}
  },[mlUsername,mlRank,mlBorder,mlAvatarUrl,mlLobbyType]);

  const genIQCImg=useCallback(async()=>{
    if(!iqcNama.trim()||!iqcWaktu.trim()){setErr("Nama dan waktu wajib diisi!");return;}
    setErr("");setLoading(true);setResult(null);setResultBlob("");
    try{const fd=new FormData();fd.append("nama",iqcNama.trim());fd.append("waktu",iqcWaktu.trim());
      if(iqcPhotoMode==="upload"&&iqcPhotoFile)fd.append("photo",iqcPhotoFile);
      else if(iqcPhotoMode==="url"&&iqcPhotoUrl.trim())fd.append("photo_url",iqcPhotoUrl.trim());
      await blobRes(await fetch("/api/iqc-image",{method:"POST",body:fd}));
    }catch{setErr("Koneksi error");}finally{setLoading(false);}
  },[iqcNama,iqcWaktu,iqcPhotoFile,iqcPhotoUrl,iqcPhotoMode]);

  const genIQCTxt=useCallback(async()=>{
    if(!iqcText.trim()||!iqcTime.trim()){setErr("Teks dan waktu wajib diisi!");return;}
    setErr("");setLoading(true);setResult(null);setResultBlob("");
    try{await blobRes(await fetch("/api/iqc-text",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:iqcText.trim(),time:iqcTime.trim(),baterai:[iqcBaterai,iqcBatLevel],operator:iqcOperator,timebar:iqcTimebar,wifi:iqcWifi})}));}
    catch{setErr("Koneksi error");}finally{setLoading(false);}
  },[iqcText,iqcTime,iqcBaterai,iqcBatLevel,iqcOperator,iqcTimebar,iqcWifi]);

  function makeGen(endpoint:string,body:Record<string,unknown>,validate?:()=>string|null){
    return async()=>{
      if(validate){const e=validate();if(e){setErr(e);return;}}
      setErr("");setLoading(true);setResult(null);setResultBlob("");
      try{await blobRes(await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}));}
      catch{setErr("Koneksi error");}finally{setLoading(false);}
    };
  }

  function makeFormGen(endpoint:string,fields:()=>FormData,validate?:()=>string|null){
    return async()=>{
      if(validate){const e=validate();if(e){setErr(e);return;}}
      setErr("");setLoading(true);setResult(null);setResultBlob("");
      try{await blobRes(await fetch(endpoint,{method:"POST",body:fields()}));}
      catch{setErr("Koneksi error");}finally{setLoading(false);}
    };
  }

  const genSmeme   = makeFormGen("/api/smeme",   ()=>{const fd=new FormData();fd.append("top",smTop);fd.append("bottom",smBot);if(smFile)fd.append("image",smFile);fd.append("fontsize",String(smFontSize));return fd;},
    ()=>!smFile?"Upload gambar dulu":(!smTop&&!smBot)?"Isi teks atas atau bawah":null);
  const genIQCPink = makeGen("/api/iqc-pink",{text:pinkText,time:pinkTime||"00.00"},
    ()=>!pinkText.trim()?"Teks wajib diisi":null);
  const genTTQC    = makeFormGen("/api/ttqc",()=>{const fd=new FormData();fd.append("username",ttUsername||"Satriadevs");fd.append("text",ttText);if(ttAvFile)fd.append("avatar",ttAvFile);return fd;},
    ()=>!ttText.trim()?"Teks wajib diisi":null);
  const genUstadz  = makeGen("/api/ustadz",  {top:ustText},     ()=>!ustText.trim()?"Teks wajib diisi":null);
  const genBratnime= makeGen("/api/bratnime",{text:bratText},   ()=>!bratText.trim()?"Teks wajib diisi":null);
  const genBangjago= makeGen("/api/bangjago",{nama:bangNama,saldo:bangSaldo},()=>(!bangNama.trim()||!bangSaldo.trim())?"Nama dan saldo wajib diisi":null);
  const genBalogo   = makeGen("/api/balogo",  {left:baLeft,right:baRight,transparent:baTransparent},()=>(!baLeft.trim()||!baRight.trim())?"Teks kiri dan kanan wajib diisi":null);
  const genFakeig   = makeFormGen("/api/fakeig",()=>{const fd=new FormData();fd.append("name",igName||"Someone");fd.append("text",igText);if(igAvFile)fd.append("avatar",igAvFile);return fd;},()=>!igText.trim()?"Teks wajib diisi":null);
  const genFakeig2  = makeFormGen("/api/fakeig2",()=>{const fd=new FormData();fd.append("name",ig2Name||"Someone");fd.append("text",ig2Text);if(ig2AvFile)fd.append("avatar",ig2AvFile);return fd;},()=>!ig2Text.trim()?"Teks wajib diisi":null);
  const genWafat    = makeFormGen("/api/wafat",()=>{const fd=new FormData();fd.append("nama",wafatNama||"Nama Almarhum");fd.append("tanggal",wafatTgl);fd.append("pesan",wafatPesan);if(wafatFoto)fd.append("foto",wafatFoto);return fd;});
  const genReminder = makeGen("/api/reminder",{title:rmdTitle,pesan:rmdPesan,waktu:rmdWaktu},()=>!rmdTitle.trim()?"Judul wajib diisi":null);
  const genNokia    = makeGen("/api/quote-nokia",{text:nokText,sender:nokSender},()=>!nokText.trim()?"Teks wajib diisi":null);
  const genDana     = makeGen("/api/fake-dana",{amount:danaAmount,nama:danaNama},()=>!danaAmount.trim()?"Nominal wajib diisi":null);
  const genCall     = makeFormGen("/api/fake-call",()=>{const fd=new FormData();fd.append("name",callName||"Unknown");fd.append("duration",callDuration||"00.00");if(callAvFile)fd.append("avatar",callAvFile);return fd;},
    ()=>!callName.trim()?"Nama wajib diisi":null);
  const genIGStory  = makeFormGen("/api/igstory-img",()=>{
    const fd=new FormData();
    fd.append("nama",igstoryNama||"Someone");
    fd.append("username",igstoryUser||"someone");
    if(igstoryFotoFile)fd.append("foto",igstoryFotoFile);
    else if(igstoryFotoUrl)fd.append("foto_url",igstoryFotoUrl);
    if(igstoryPpFile)fd.append("pp",igstoryPpFile);
    else if(igstoryPpUrl)fd.append("pp_url",igstoryPpUrl);
    return fd;
  },()=>null);
  const genIQCDark  = makeFormGen("/api/iqc-dark",()=>{
    const fd=new FormData();
    fd.append("time",darkTime||"00.00");
    fd.append("text",darkText);
    if(darkImgFile)fd.append("image",darkImgFile);
    else if(darkImgUrl)fd.append("image_url",darkImgUrl);
    return fd;
  },()=>(!darkText.trim()&&!darkImgFile&&!darkImgUrl)?"Isi teks atau upload gambar":null);
  const genDevCard  = makeGen("/api/dev-card",{name:devName,title:devTitle,script:devScript,telegram:devTelegram},()=>!devName.trim()?"Nama wajib diisi":null);
  const genFakeWin  = makeGen("/api/fake-windows",{text:winText},()=>!winText.trim()?"Teks wajib diisi":null);
  const genGoPay    = makeGen("/api/fake-gopay",{saldo:gopSaldo,koin:gopKoin||"0",terpakai:gopTerpakai||"0",bulan:gopBulan||"Januari"},()=>!gopSaldo.trim()?"Saldo wajib diisi":null);
  const genOVO      = makeGen("/api/fake-ovo",{amount:ovoAmount},()=>!ovoAmount.trim()?"Nominal wajib diisi":null);
  const genMotivasi = makeGen("/api/fake-motivasi",{quote:motQuote,author:motAuthor||"Satriadevs"},()=>!motQuote.trim()?"Quote wajib diisi":null);
  const genPixel    = makeFormGen("/api/pixelart",()=>{const fd=new FormData();if(pixFile)fd.append("image",pixFile);fd.append("level",String(pixLevel));return fd;},()=>!pixFile?"Upload gambar dulu":null);

  const handleDownload=useCallback(()=>{
    if(!result)return;
    const now=new Date();const pad=(n:number)=>String(n).padStart(2,"0");
    const ts=`${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const a=document.createElement("a");a.href=resultBlob||result.image;a.download=`satriacanvas-${ts}.png`;a.click();
  },[result,resultBlob]);

  const FF_PER=10;
  const ffTotal=Math.ceil(ffLobbies.length/FF_PER);
  const visLob=ffLobbies.slice((ffPage-1)*FF_PER,ffPage*FF_PER);
  const bdTotal=Math.ceil(mlBorders.length/8);
  const visBrd=mlBorders.slice((mlBorderPage-1)*8,mlBorderPage*8);
  const curRank=mlRanks.find(r=>r.key===mlRank);
  const blockSz=41-Math.min(Math.max(pixLevel,1),40);

  return (
    <main style={{minHeight:"100dvh",paddingBottom:80}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"0 20px"}}>
        <header className="fade-up" style={{textAlign:"center",paddingTop:"10vh",paddingBottom:40}}>
          <div style={{display:"inline-block",background:"var(--paper)",border:"2px solid var(--ink)",borderRadius:"999px",padding:"4px 18px",fontSize:11,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"var(--ink-muted)",boxShadow:"2px 2px 0 0 var(--ink)",marginBottom:18}}>CANVAS GENERATOR</div>
          <h1 style={{fontSize:"clamp(30px,6vw,50px)",fontWeight:900,letterSpacing:"-0.03em",color:"var(--ink)",lineHeight:1.1}}>Satria<span style={{color:"var(--ink-muted)"}}>Canvas</span></h1>
        </header>

        <nav className="fade-up fade-up-d1" style={{marginBottom:28,display:"flex",flexDirection:"column",gap:8}}>
          {GROUPS.map(g=>(
            <div key={g.label}>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.25em",color:"var(--ink-muted)",textTransform:"uppercase",marginBottom:5,paddingLeft:2}}>{g.label}</div>
              <div style={{display:"flex",gap:0,border:"2px solid var(--ink)",borderRadius:"var(--radius-md)",overflow:"hidden",background:"var(--paper)",boxShadow:"var(--shadow-brutal-sm)",flexWrap:"wrap"}}>
                {g.tabs.map((t,i)=>(
                  <button key={t.key} onClick={()=>chgTab(t.key)} style={{flex:"1 1 auto",minWidth:"max-content",padding:"10px 8px",background:tab===t.key?"var(--ink)":"transparent",color:tab===t.key?"var(--paper)":"var(--ink-muted)",fontWeight:800,fontSize:10,letterSpacing:"0.02em",borderRight:i<g.tabs.length-1?"1px solid var(--ink)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s",cursor:"pointer"}}>
                    <span style={{color:tab===t.key?t.accent:"inherit"}}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="slide-in" key={tab}>
          {tab==="ff"       && <FFForm username={ffUsername} setUsername={setFfUsername} selectedLobby={ffLobby} setSelectedLobby={setFfLobby} loading={loading} onGenerate={genFF} err={err}/>}
          {tab==="ml"       && <MLForm username={mlUsername} setUsername={setMlUsername} rank={mlRank} setRank={setMlRank} border={mlBorder} setBorder={setMlBorder} avatarUrl={mlAvatarUrl} setAvatarUrl={setMlAvatarUrl} lobbyType={mlLobbyType} setLobbyType={setMlLobbyType} lobbyTypes={mlLobbyTypes} ranks={mlRanks} loading={loading} onGenerate={genML} err={err}/>}
          {tab==="iqcimg"   && <IQCImgForm nama={iqcNama} setNama={setIqcNama} waktu={iqcWaktu} setWaktu={setIqcWaktu} mode={iqcPhotoMode} setMode={setIqcPhotoMode} file={iqcPhotoFile} setFile={setIqcPhotoFile} photoUrl={iqcPhotoUrl} setPhotoUrl={setIqcPhotoUrl} preview={iqcPreview} setPreview={setIqcPreview} loading={loading} onGenerate={genIQCImg} err={err}/>}
          {tab==="iqctxt"   && <IQCTxtForm text={iqcText} setText={setIqcText} time={iqcTime} setTime={setIqcTime} baterai={iqcBaterai} setBaterai={setIqcBaterai} batLevel={iqcBatLevel} setBatLevel={setIqcBatLevel} operator={iqcOperator} setOperator={setIqcOperator} timebar={iqcTimebar} setTimebar={setIqcTimebar} wifi={iqcWifi} setWifi={setIqcWifi} loading={loading} onGenerate={genIQCTxt} err={err}/>}
          {tab==="iqcpink"  && <SimpleForm title="IQC Pink — Input" hint="Chat bubble bergaya pink dengan reaction bar. Avatar default otomatis dipakai." hintColor="rgba(255,184,216,0.3)" fields={[{l:"Waktu",v:pinkTime,s:setPinkTime,p:"22.54",mx:10},{l:"Teks Pesan",v:pinkText,s:setPinkText,p:"Tulis pesan di sini...",mx:200,ta:true,rows:4}]} loading={loading} onGenerate={genIQCPink} err={err} label="▶  Generate IQC Pink"/>}
          {tab==="ttqc"     && <IGForm title="TTQC — Input" hint="Screenshot DM bergaya TikTok dengan menu konteks. Avatar opsional, pakai upload atau URL." hintColor="rgba(200,200,200,0.3)" name={ttUsername} setName={setTtUsername} text={ttText} setText={setTtText} avFile={ttAvFile} setAvFile={setTtAvFile} avPreview={ttAvPreview} setAvPreview={setTtAvPreview} loading={loading} onGenerate={genTTQC} err={err} label="▶  Generate TTQC" namePlaceholder="Satriadevs" nameLabel="Username" textLabel="Teks Pesan"/>}
          {tab==="devcard"  && <SimpleForm title="Dev Card" hint="Generate kartu ID developer bergaya JSON." hintColor="rgba(138,255,160,0.2)" fields={[{l:"Nama",v:devName,s:setDevName,p:"Satriadevs",mx:30},{l:"Title / Role",v:devTitle,s:setDevTitle,p:"developer",mx:30},{l:"Script / Tech",v:devScript,s:setDevScript,p:"md, js, ts...",mx:30},{l:"Telegram",v:devTelegram,s:setDevTelegram,p:"@Satriadevs",mx:40}]} loading={loading} onGenerate={genDevCard} err={err} label="▶  Generate Dev Card"/>}
          {tab==="fakewin"  && <SimpleForm title="Fake Windows" hint="Teks akan ditampilkan seperti teks Windows Media Player." hintColor="rgba(200,216,255,0.3)" fields={[{l:"Teks",v:winText,s:setWinText,p:"kenapa ya yang tulus sering kalah",mx:200,ta:true}]} loading={loading} onGenerate={genFakeWin} err={err} label="▶  Generate Fake Windows"/>}
          {tab==="gopay"    && <SimpleForm title="Fake GoPay" hint="Isi angka saja tanpa titik/koma." hintColor="rgba(184,240,216,0.3)" fields={[{l:"Saldo (Rp)",v:gopSaldo,s:setGopSaldo,p:"890000",mx:20,half:true},{l:"GoPay Coins",v:gopKoin,s:setGopKoin,p:"159",mx:10,half:true},{l:"Terpakai (Rp)",v:gopTerpakai,s:setGopTerpakai,p:"0",mx:20,half:true},{l:"Bulan",v:gopBulan,s:setGopBulan,p:"Mei",mx:20,half:true}]} loading={loading} onGenerate={genGoPay} err={err} label="▶  Generate Fake GoPay"/>}
          {tab==="ovo"      && <SimpleForm title="Fake OVO" hint="Isi nominal saldo OVO tanpa titik/koma." hintColor="rgba(232,200,255,0.3)" fields={[{l:"Nominal Saldo (Rp)",v:ovoAmount,s:setOvoAmount,p:"5000000",mx:15}]} loading={loading} onGenerate={genOVO} err={err} label="▶  Generate Fake OVO"/>}
          {tab==="dana"     && <SimpleForm title="Fake DANA" hint="Isi nominal saldo DANA tanpa titik/koma." hintColor="rgba(184,216,255,0.3)" fields={[{l:"Nominal Saldo (Rp)",v:danaAmount,s:setDanaAmount,p:"1500000",mx:15},{l:"Nama (opsional)",v:danaNama,s:setDanaNama,p:"Satriadevs",mx:30}]} loading={loading} onGenerate={genDana} err={err} label="▶  Generate Fake DANA"/>}
          {tab==="call"     && <IGForm title="Fake Call — Input" hint="Layar panggilan WhatsApp asli bergaya video call. Avatar opsional, pakai upload atau URL." hintColor="rgba(216,216,255,0.3)" name={callName} setName={setCallName} text={callDuration} setText={setCallDuration} avFile={callAvFile} setAvFile={setCallAvFile} avPreview={callAvPreview} setAvPreview={setCallAvPreview} loading={loading} onGenerate={genCall} err={err} label="▶  Generate Fake Call" namePlaceholder="Mama" nameLabel="Nama Kontak" textLabel="Durasi Panggilan"/>}
          {tab==="motivasi" && <SimpleForm title="Fake Motivasi" hint="Quote dengan font handwriting di atas background." hintColor="rgba(255,232,160,0.3)" fields={[{l:"Quote / Kata Motivasi",v:motQuote,s:setMotQuote,p:"Tidak selalu hidup berjalan mulus...",mx:300,ta:true,rows:4},{l:"Author / Penulis",v:motAuthor,s:setMotAuthor,p:"Satriadevs",mx:50}]} loading={loading} onGenerate={genMotivasi} err={err} label="▶  Generate Motivasi"/>}
          {tab==="smeme"    && <SmemeForm top={smTop} setTop={setSmTop} bot={smBot} setBot={setSmBot} file={smFile} setFile={setSmFile} preview={smPreview} setPreview={setSmPreview} fontSize={smFontSize} setFontSize={setSmFontSize} loading={loading} onGenerate={genSmeme} err={err}/>}
          {tab==="ustadz"   && <SimpleForm title="Ustadz Meme" hint="Teks akan dirender di atas template ustadz." hintColor="rgba(216,240,160,0.3)" fields={[{l:"Teks",v:ustText,s:setUstText,p:"Sesungguhnya yang sabar akan menang...",mx:200,ta:true,rows:3}]} loading={loading} onGenerate={genUstadz} err={err} label="▶  Generate Ustadz"/>}
          {tab==="bratnime" && <SimpleForm title="Brat Anime" hint="Teks bergaya Brat di background anime." hintColor="rgba(200,255,224,0.3)" fields={[{l:"Teks",v:bratText,s:setBratText,p:"you're so not brat",mx:120,ta:true,rows:3}]} loading={loading} onGenerate={genBratnime} err={err} label="▶  Generate Brat Anime"/>}
          {tab==="bangjago" && <SimpleForm title="BangJago Saldo" hint="Saldo akan ditampilkan di kartu BangJago." hintColor="rgba(255,216,200,0.3)" fields={[{l:"Nama",v:bangNama,s:setBangNama,p:"Satria",mx:30,half:true},{l:"Saldo (Rp)",v:bangSaldo,s:setBangSaldo,p:"1000000",mx:20,half:true}]} loading={loading} onGenerate={genBangjago} err={err} label="▶  Generate BangJago"/>}
          {tab==="balogo"   && <BalogoForm left={baLeft} setLeft={setBaLeft} right={baRight} setRight={setBaRight} transparent={baTransparent} setTransparent={setBaTransparent} loading={loading} onGenerate={genBalogo} err={err}/>}
          {tab==="fakeig"   && <IGForm title="Fake IG" hint="Foto Instagram bergaya story dengan avatar dan teks." hintColor="rgba(255,200,240,0.3)" name={igName} setName={setIgName} text={igText} setText={setIgText} avFile={igAvFile} setAvFile={setIgAvFile} avPreview={igAvPreview} setAvPreview={setIgAvPreview} loading={loading} onGenerate={genFakeig} err={err} label="▶  Generate Fake IG" namePlaceholder="Username Instagram"/>}
          {tab==="fakeig2"  && <IGForm title="Fake IG v2" hint='Kata dalam (tanda kurung) akan berwarna merah. Contoh: "Ini (kata merah) biasa"' hintColor="rgba(248,200,255,0.3)" name={ig2Name} setName={setIg2Name} text={ig2Text} setText={setIg2Text} avFile={ig2AvFile} setAvFile={setIg2AvFile} avPreview={ig2AvPreview} setAvPreview={setIg2AvPreview} loading={loading} onGenerate={genFakeig2} err={err} label="▶  Generate Fake IG v2" namePlaceholder="Username Instagram"/>}
          {tab==="igstory"  && <IGStoryImgForm nama={igstoryNama} setNama={setIgstoryNama} user={igstoryUser} setUser={setIgstoryUser} fotoFile={igstoryFotoFile} setFotoFile={setIgstoryFotoFile} fotoPreview={igstoryFotoPreview} setFotoPreview={setIgstoryFotoPreview} fotoUrl={igstoryFotoUrl} setFotoUrl={setIgstoryFotoUrl} ppFile={igstoryPpFile} setPpFile={setIgstoryPpFile} ppPreview={igstoryPpPreview} setPpPreview={setIgstoryPpPreview} ppUrl={igstoryPpUrl} setPpUrl={setIgstoryPpUrl} loading={loading} onGenerate={genIGStory} err={err}/>}
          {tab==="iqcdark"  && <IQCDarkForm time={darkTime} setTime={setDarkTime} text={darkText} setText={setDarkText} imgFile={darkImgFile} setImgFile={setDarkImgFile} imgPreview={darkImgPreview} setImgPreview={setDarkImgPreview} imgUrl={darkImgUrl} setImgUrl={setDarkImgUrl} loading={loading} onGenerate={genIQCDark} err={err}/>}
          {tab==="wafat"    && <WafatForm nama={wafatNama} setNama={setWafatNama} tgl={wafatTgl} setTgl={setWafatTgl} pesan={wafatPesan} setPesan={setWafatPesan} foto={wafatFoto} setFoto={setWafatFoto} preview={wafatPreview} setPreview={setWafatPreview} loading={loading} onGenerate={genWafat} err={err}/>}
          {tab==="reminder" && <SimpleForm title="Reminder" hint="Gambar pengingat dengan judul, waktu, dan pesan." hintColor="rgba(255,232,200,0.3)" fields={[{l:"Judul",v:rmdTitle,s:setRmdTitle,p:"Reminder Sholat Subuh",mx:60},{l:"Waktu (opsional)",v:rmdWaktu,s:setRmdWaktu,p:"04.30 WIB",mx:30},{l:"Pesan (opsional)",v:rmdPesan,s:setRmdPesan,p:"Jangan lupa...",mx:300,ta:true,rows:3}]} loading={loading} onGenerate={genReminder} err={err} label="▶  Generate Reminder"/>}
          {tab==="qnokia"   && <SimpleForm title="Quote Nokia" hint="Quote bergaya layar Nokia jadul." hintColor="rgba(200,248,216,0.3)" fields={[{l:"Teks / Quote",v:nokText,s:setNokText,p:"Dulu kita susah bareng sekarang kamu bahagia sendiri",mx:200,ta:true,rows:3},{l:"Pengirim (opsional)",v:nokSender,s:setNokSender,p:"Satriadevs",mx:20}]} loading={loading} onGenerate={genNokia} err={err} label="▶  Generate Quote Nokia"/>}
          {tab==="pixel"    && <PixelForm file={pixFile} setFile={setPixFile} preview={pixPreview} setPreview={setPixPreview} level={pixLevel} setLevel={setPixLevel} blockSz={blockSz} loading={loading} onGenerate={genPixel} err={err}/>}
        </div>

        {tab==="ff" && <FFLobbyTable lobbies={visLob} dataLoading={dataLoading} selectedLobby={ffLobby} onSelect={(id)=>setFfLobby(id===ffLobby?null:id)} page={ffPage} totalPages={ffTotal} onPageChange={setFfPage}/>}
        {tab==="ml" && <MLBorderTable borders={visBrd} dataLoading={dataLoading} ranks={mlRanks} selectedBorder={mlBorder} onSelect={(id)=>setMlBorder(id===mlBorder?0:id)} page={mlBorderPage} totalPages={bdTotal} onPageChange={setMlBorderPage} currentRank={curRank}/>}

        {result && <OutputSection ref={outputRef} result={result} accentBg={ACCENTS[tab]} onDownload={handleDownload}/>}

        <footer style={{textAlign:"center",paddingTop:24,paddingBottom:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,fontWeight:700,color:"var(--ink-muted)",letterSpacing:"0.15em",textTransform:"uppercase"}}>SatriaCanvas</span>
          <a href="/docs" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",background:"var(--paper)",border:"2px solid var(--ink)",borderRadius:"999px",color:"var(--ink)",fontSize:11,fontWeight:800,textTransform:"uppercase",textDecoration:"none",boxShadow:"2px 2px 0 0 var(--ink)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
            API Docs
          </a>
        </footer>
      </div>
    </main>
  );
}

function C({children,delay=0}:{children:React.ReactNode;delay?:number}){return<div className="brutal-card fade-up" style={{marginBottom:24,animationDelay:`${delay}s`}}>{children}</div>;}
function CH({label,right}:{label:string;right?:React.ReactNode}){return<div style={{padding:"14px 20px",borderBottom:"2px solid var(--ink)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--ink)",borderRadius:"calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0"}}><span style={{fontSize:11,fontWeight:800,letterSpacing:"0.2em",color:"var(--paper)",textTransform:"uppercase"}}>{label}</span>{right&&<span style={{fontSize:11,fontWeight:600,color:"rgba(255,253,247,0.5)"}}>{right}</span>}</div>;}
function LT({children}:{children:React.ReactNode}){return<div style={{fontSize:11,fontWeight:800,letterSpacing:"0.15em",color:"var(--ink-soft)",textTransform:"uppercase",marginBottom:6}}>{children}</div>;}
function EB({msg}:{msg:string}){if(!msg)return null;return<div style={{padding:"10px 14px",background:"rgba(255,122,107,0.12)",border:"2px solid #ff7a6b",borderRadius:"var(--radius-sm)",color:"#c0392b",fontSize:13,fontWeight:700}}>⚠ {msg}</div>;}
function GB({loading,onClick,label}:{loading:boolean;onClick:()=>void;label:string}){return<button onClick={onClick} disabled={loading} className={loading?"":"brutal-btn"} style={{padding:"13px 0",width:"100%",background:loading?"rgba(26,26,26,0.08)":"var(--ink)",border:"2px solid var(--ink)",borderRadius:"var(--radius-md)",color:loading?"var(--ink-muted)":"var(--paper)",fontSize:13,fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"var(--shadow-brutal-sm)",transition:"all 0.15s"}}>{loading?"MEMPROSES...":label}</button>;}
function CB({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return<button onClick={onClick} style={{padding:"6px 12px",background:active?"var(--ink)":"var(--paper)",border:"2px solid var(--ink)",borderRadius:999,color:active?"var(--paper)":"var(--ink-muted)",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.13s",boxShadow:active?"none":"1px 1px 0 0 var(--ink)"}}>{children}</button>;}
function NB({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return<button onClick={onClick} style={{width:34,height:30,background:active?"var(--ink)":"var(--paper)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",color:active?"var(--paper)":"var(--ink-muted)",fontSize:11,fontWeight:800,cursor:"pointer",transition:"all 0.13s",boxShadow:active?"none":"1px 1px 0 0 var(--ink)"}}>{children}</button>;}
function IF({label,value,onChange,placeholder,maxLength,onKeyDown,hint,type="text"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;maxLength?:number;onKeyDown?:(e:React.KeyboardEvent)=>void;hint?:boolean;type?:string}){
  const[foc,setFoc]=useState(false);
  return<div>{label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><LT>{label}</LT>{hint&&maxLength&&<span style={{fontSize:11,fontWeight:600,color:value.length>=maxLength-2?"var(--ink)":"var(--ink-muted)"}}>{value.length}/{maxLength}</span>}</div>}
  <input type={type} value={value} onChange={e=>onChange(maxLength?e.target.value.slice(0,maxLength):e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} className="brutal-input" style={{width:"100%",padding:"11px 14px",fontSize:16,fontWeight:700,boxShadow:foc?"3px 3px 0 0 var(--ink)":"none"}} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}/></div>;}
function TA({label,value,onChange,placeholder,maxLength,rows=4}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;maxLength?:number;rows?:number}){
  const[foc,setFoc]=useState(false);
  return<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><LT>{label}</LT>{maxLength&&<span style={{fontSize:11,fontWeight:600,color:value.length>=maxLength-10?"var(--ink)":"var(--ink-muted)"}}>{value.length}/{maxLength}</span>}</div>
  <textarea value={value} onChange={e=>onChange(maxLength?e.target.value.slice(0,maxLength):e.target.value)} placeholder={placeholder} rows={rows} className="brutal-input" style={{width:"100%",padding:"11px 14px",fontSize:15,fontWeight:600,boxShadow:foc?"3px 3px 0 0 var(--ink)":"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}/></div>;}
function SF({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
  const[foc,setFoc]=useState(false);
  return<div><LT>{label}</LT><div style={{position:"relative"}}><select value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} className="brutal-input" style={{width:"100%",appearance:"none",WebkitAppearance:"none",padding:"11px 36px 11px 14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:foc?"3px 3px 0 0 var(--ink)":"none"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"var(--ink)",pointerEvents:"none"}}>{I.chev}</div></div></div>;}
function TG({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}){return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}><span style={{fontSize:13,fontWeight:700,color:"var(--ink-soft)"}}>{label}</span><button onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:999,background:value?"var(--ink)":"rgba(26,26,26,0.15)",border:"2px solid var(--ink)",cursor:"pointer",position:"relative",transition:"background 0.15s",flexShrink:0}}><div style={{width:16,height:16,borderRadius:999,background:value?"var(--paper)":"var(--ink)",position:"absolute",top:2,left:value?22:2,transition:"left 0.15s"}}/></button></div>;}
function PU({file,preview,onFile,onClear,label="Foto"}:{file:File|null;preview:string;onFile:(f:File)=>void;onClear:()=>void;label?:string}){
  const ref=useRef<HTMLInputElement>(null);
  return<div><LT>{label}</LT><input ref={ref} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;onFile(f);}} style={{display:"none"}}/>
  {preview?<div style={{position:"relative"}}><img src={preview} alt="preview" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:"var(--radius-sm)",border:"2px solid var(--ink)",display:"block"}} draggable={false}/><button onClick={onClear} style={{position:"absolute",top:6,right:6,width:26,height:26,background:"var(--ink)",border:"2px solid var(--ink)",borderRadius:999,color:"var(--paper)",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button><div style={{marginTop:6,fontSize:11,color:"var(--ink-muted)",fontWeight:600}}>{file?.name}</div></div>
  :<button onClick={()=>ref.current?.click()} style={{width:"100%",padding:"24px 0",background:"var(--cream)",border:"2px dashed var(--ink)",borderRadius:"var(--radius-sm)",color:"var(--ink-muted)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>{I.cam}<span>Klik untuk pilih gambar</span></button>}</div>;}
const TH_S:React.CSSProperties={padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:800,letterSpacing:"0.2em",color:"var(--ink-muted)",borderBottom:"2px solid var(--ink)",background:"var(--cream)",textTransform:"uppercase",whiteSpace:"nowrap"};
function Pag({page,total,onChange}:{page:number;total:number;onChange:(p:number)=>void}){
  if(total<=1)return null;
  return<div style={{padding:"12px 20px",borderTop:"2px solid var(--ink)",display:"flex",justifyContent:"center",gap:4,background:"rgba(26,26,26,0.02)"}}>
    <button onClick={()=>onChange(Math.max(1,page-1))} disabled={page===1} style={{padding:"5px 12px",background:"var(--paper)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",color:"var(--ink)",fontSize:11,fontWeight:700,cursor:page===1?"not-allowed":"pointer",opacity:page===1?0.4:1,boxShadow:"1px 1px 0 0 var(--ink)"}}>‹</button>
    {Array.from({length:total},(_,i)=>i+1).map(p=><button key={p} onClick={()=>onChange(p)} style={{width:28,height:26,background:p===page?"var(--ink)":"var(--paper)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",color:p===page?"var(--paper)":"var(--ink-muted)",fontSize:11,fontWeight:800,cursor:"pointer",boxShadow:p===page?"none":"1px 1px 0 0 var(--ink)"}}>{p}</button>)}
    <button onClick={()=>onChange(Math.min(total,page+1))} disabled={page===total} style={{padding:"5px 12px",background:"var(--paper)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",color:"var(--ink)",fontSize:11,fontWeight:700,cursor:page===total?"not-allowed":"pointer",opacity:page===total?0.4:1,boxShadow:"1px 1px 0 0 var(--ink)"}}>›</button>
  </div>;}

function SimpleForm({title,hint,hintColor,fields,loading,onGenerate,err,label}:{title:string;hint:string;hintColor:string;fields:{l:string;v:string;s:(v:string)=>void;p?:string;mx?:number;ta?:boolean;rows?:number;half?:boolean}[];loading:boolean;onGenerate:()=>void;err:string;label:string}){
  const pairs=fields.reduce((acc:{l:string;v:string;s:(v:string)=>void;p?:string;mx?:number;ta?:boolean;rows?:number;half?:boolean}[][],f,i)=>{
    if(!f.half){acc.push([f]);}else if(i>0&&fields[i-1].half&&acc.length>0&&acc[acc.length-1].length===1&&acc[acc.length-1][0].half){acc[acc.length-1].push(f);}else{acc.push([f]);}return acc;
  },[] as {l:string;v:string;s:(v:string)=>void;p?:string;mx?:number;ta?:boolean;rows?:number;half?:boolean}[][]);
  return<C><CH label={title}/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:hintColor,border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>{hint}</p></div>
    {pairs.map((row,ri)=>(
      row.length===2?<div key={ri} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {row.map((f,fi)=>f.ta?<TA key={fi} label={f.l} value={f.v} onChange={f.s} placeholder={f.p} maxLength={f.mx} rows={f.rows}/>:<IF key={fi} label={f.l} value={f.v} onChange={f.s} placeholder={f.p} maxLength={f.mx}/>)}
      </div>:<div key={ri}>{row[0].ta?<TA label={row[0].l} value={row[0].v} onChange={row[0].s} placeholder={row[0].p} maxLength={row[0].mx} rows={row[0].rows}/>:<IF label={row[0].l} value={row[0].v} onChange={row[0].s} placeholder={row[0].p} maxLength={row[0].mx}/>}</div>
    ))}
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label={label}/>
  </div></C>;}

function FFForm({username,setUsername,selectedLobby,setSelectedLobby,loading,onGenerate,err}:{username:string;setUsername:(v:string)=>void;selectedLobby:number|null;setSelectedLobby:(v:number|null)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="Free Fire — Input" right="lobby 1–30 · maks 20 karakter"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
    <IF label="Username" value={username} onChange={setUsername} placeholder="Masukkan username..." maxLength={20} hint onKeyDown={e=>e.key==="Enter"&&onGenerate()}/>
    <div><LT>Pilih Nomor Lobby</LT><div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      <CB active={selectedLobby===null} onClick={()=>setSelectedLobby(null)}>RANDOM</CB>
      {Array.from({length:30},(_,i)=>i+1).map(n=><NB key={n} active={selectedLobby===n} onClick={()=>setSelectedLobby(n===selectedLobby?null:n)}>{n}</NB>)}
    </div></div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate FF"/>
  </div></C>;}

function MLForm({username,setUsername,rank,setRank,border,setBorder,avatarUrl,setAvatarUrl,lobbyType,setLobbyType,lobbyTypes,ranks,loading,onGenerate,err}:{username:string;setUsername:(v:string)=>void;rank:string;setRank:(v:string)=>void;border:number;setBorder:(v:number)=>void;avatarUrl:string;setAvatarUrl:(v:string)=>void;lobbyType:string;setLobbyType:(v:string)=>void;lobbyTypes:{key:string;label:string}[];ranks:RankItem[];loading:boolean;onGenerate:()=>void;err:string}){
  const cur=ranks.find(r=>r.key===rank);
  return<C><CH label="Mobile Legends — Input" right="7 rank · 16 border · 2 lobby"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <IF label="Username" value={username} onChange={setUsername} placeholder="Nama player..." maxLength={15} hint onKeyDown={e=>e.key==="Enter"&&onGenerate()}/>
      <SF label="Rank" value={rank} onChange={setRank} options={ranks.map(r=>({value:r.key,label:r.label}))}/>
    </div>
    {cur&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--cream)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",boxShadow:"2px 2px 0 0 var(--ink)"}}>
      <img src={`/ml/rank/${cur.key}.webp`} alt={cur.label} style={{width:36,height:36,objectFit:"contain"}} draggable={false}/>
      <div><div style={{fontWeight:800,fontSize:14,color:cur.color}}>{cur.label}</div><div style={{fontSize:10,fontWeight:700,color:"var(--ink-muted)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Rank Dipilih</div></div>
      <span style={{marginLeft:"auto",color:cur.color}}>{I.star}</span>
    </div>}
    <div><LT>Tipe Lobby</LT><div style={{display:"flex",gap:8}}>
      {(lobbyTypes.length>0?lobbyTypes:[{key:"jp",label:"Lobby Jepang"},{key:"indo",label:"Lobby Indo"}]).map(lt=>(
        <button key={lt.key} onClick={()=>setLobbyType(lt.key)} style={{flex:1,padding:"10px 0",background:lobbyType===lt.key?"var(--ink)":"var(--paper)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",color:lobbyType===lt.key?"var(--paper)":"var(--ink-muted)",fontSize:12,fontWeight:800,cursor:"pointer",transition:"all 0.13s",boxShadow:lobbyType===lt.key?"none":"1px 1px 0 0 var(--ink)"}}>{lt.label}</button>
      ))}
    </div></div>
    <IF label="Avatar URL (opsional)" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://example.com/avatar.jpg"/>
    <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><LT>Border</LT><span style={{fontSize:11,fontWeight:600,color:"var(--ink-muted)"}}>{border===0?"default gold":`border #${border}`}</span></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        <CB active={border===0} onClick={()=>setBorder(0)}>DEFAULT</CB>
        {Array.from({length:16},(_,i)=>i+1).map(n=><NB key={n} active={border===n} onClick={()=>setBorder(n===border?0:n)}>{n}</NB>)}
      </div>
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate ML"/>
  </div></C>;}

function IQCImgForm({nama,setNama,waktu,setWaktu,mode,setMode,file,setFile,photoUrl,setPhotoUrl,preview,setPreview,loading,onGenerate,err}:{nama:string;setNama:(v:string)=>void;waktu:string;setWaktu:(v:string)=>void;mode:"upload"|"url";setMode:(v:"upload"|"url")=>void;file:File|null;setFile:(v:File|null)=>void;photoUrl:string;setPhotoUrl:(v:string)=>void;preview:string;setPreview:(v:string)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="IQC Image — Input" right="canvas WhatsApp screenshot"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <IF label="Nama" value={nama} onChange={setNama} placeholder="Nama pengirim..." maxLength={25} hint/>
      <IF label="Waktu" value={waktu} onChange={setWaktu} placeholder="13.56" maxLength={10}/>
    </div>
    <div><LT>Foto</LT><div style={{display:"flex",gap:8,marginBottom:10}}>
      <CB active={mode==="upload"} onClick={()=>setMode("upload")}>{I.upl} Upload</CB>
      <CB active={mode==="url"} onClick={()=>setMode("url")}>URL</CB>
    </div>
    {mode==="upload"?<PU file={file} preview={preview} onFile={f=>{setFile(f);setPreview(URL.createObjectURL(f));}} onClear={()=>{setFile(null);setPreview("");}} label=""/>:<IF label="" value={photoUrl} onChange={setPhotoUrl} placeholder="https://example.com/photo.jpg"/>}
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate IQC Image"/>
  </div></C>;}

function IQCTxtForm({text,setText,time,setTime,baterai,setBaterai,batLevel,setBatLevel,operator,setOperator,timebar,setTimebar,wifi,setWifi,loading,onGenerate,err}:{text:string;setText:(v:string)=>void;time:string;setTime:(v:string)=>void;baterai:boolean;setBaterai:(v:boolean)=>void;batLevel:string;setBatLevel:(v:string)=>void;operator:boolean;setOperator:(v:boolean)=>void;timebar:boolean;setTimebar:(v:boolean)=>void;wifi:boolean;setWifi:(v:boolean)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="IQC Text — Input" right="WhatsApp chat screenshot"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
    <TA label="Teks Pesan" value={text} onChange={setText} placeholder="Ketik pesan di sini..." maxLength={500}/>
    <IF label="Waktu" value={time} onChange={setTime} placeholder="13.56" maxLength={10}/>
    <div style={{border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)",overflow:"hidden",boxShadow:"2px 2px 0 0 var(--ink)"}}>
      <div style={{padding:"10px 14px",background:"var(--ink)"}}><span style={{fontSize:11,fontWeight:800,letterSpacing:"0.15em",color:"var(--paper)",textTransform:"uppercase"}}>Status Bar</span></div>
      <div style={{padding:"4px 14px 8px",background:"var(--cream)",display:"flex",flexDirection:"column"}}>
        <TG label="Tampilkan Waktu" value={timebar} onChange={setTimebar}/>
        <TG label="Tampilkan Operator" value={operator} onChange={setOperator}/>
        <TG label="Tampilkan WiFi" value={wifi} onChange={setWifi}/>
        <TG label="Tampilkan Baterai" value={baterai} onChange={setBaterai}/>
        {baterai&&<div style={{paddingTop:4,paddingBottom:4}}><SF label="Level Baterai" value={batLevel} onChange={setBatLevel} options={["100","90","80","70","60","50","40","30","20","10"].map(v=>({value:v,label:`${v}%`}))}/></div>}
      </div>
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate IQC Text"/>
  </div></C>;}

function SmemeForm({top,setTop,bot,setBot,file,setFile,preview,setPreview,fontSize,setFontSize,loading,onGenerate,err}:{top:string;setTop:(v:string)=>void;bot:string;setBot:(v:string)=>void;file:File|null;setFile:(v:File|null)=>void;preview:string;setPreview:(v:string)=>void;fontSize:number;setFontSize:(v:number)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="Stiker Meme — Input" right="meme text + gambar"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <PU file={file} preview={preview} onFile={f=>{setFile(f);setPreview(URL.createObjectURL(f));}} onClear={()=>{setFile(null);setPreview("");}} label="Upload Gambar"/>
    <IF label="Teks Atas" value={top} onChange={setTop} placeholder="WHEN YOU..." maxLength={100}/>
    <IF label="Teks Bawah" value={bot} onChange={setBot} placeholder="THEN THIS HAPPENS" maxLength={100}/>
    <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><LT>Ukuran Font</LT><span style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>{fontSize}px</span></div>
      <input type="range" min={40} max={150} value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} style={{width:"100%",accentColor:"var(--ink)",height:4,cursor:"pointer"}}/>
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate Meme"/>
  </div></C>;}

function BalogoForm({left,setLeft,right,setRight,transparent,setTransparent,loading,onGenerate,err}:{left:string;setLeft:(v:string)=>void;right:string;setRight:(v:string)=>void;transparent:boolean;setTransparent:(v:boolean)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="BA Logo — Input" right="Blue Archive gaya logo"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:"rgba(208,200,255,0.3)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>Teks kiri biru, teks kanan hitam dengan outline putih. Style logo Blue Archive.</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <IF label="Teks Kiri (biru)" value={left} onChange={setLeft} placeholder="Satria" maxLength={20}/>
      <IF label="Teks Kanan (hitam)" value={right} onChange={setRight} placeholder="devs" maxLength={20}/>
    </div>
    <TG label="Background transparan" value={transparent} onChange={setTransparent}/>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate BA Logo"/>
  </div></C>;}

function IGForm({title,hint,hintColor,name,setName,text,setText,avFile,setAvFile,avPreview,setAvPreview,loading,onGenerate,err,label,namePlaceholder,nameLabel,textLabel}:{title:string;hint:string;hintColor:string;name:string;setName:(v:string)=>void;text:string;setText:(v:string)=>void;avFile:File|null;setAvFile:(v:File|null)=>void;avPreview:string;setAvPreview:(v:string)=>void;loading:boolean;onGenerate:()=>void;err:string;label:string;namePlaceholder?:string;nameLabel?:string;textLabel?:string}){
  return<C><CH label={title}/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:hintColor,border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>{hint}</p></div>
    <IF label={nameLabel||"Username"} value={name} onChange={setName} placeholder={namePlaceholder||"Someone"} maxLength={30}/>
    <TA label={textLabel||"Teks / Caption"} value={text} onChange={setText} placeholder="Tulis caption di sini..." maxLength={300} rows={4}/>
    <PU file={avFile} preview={avPreview} onFile={f=>{setAvFile(f);setAvPreview(URL.createObjectURL(f));}} onClear={()=>{setAvFile(null);setAvPreview("");}} label="Avatar (opsional — pakai default jika kosong)"/>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label={label}/>
  </div></C>;}

function IGStoryImgForm({nama,setNama,user,setUser,fotoFile,setFotoFile,fotoPreview,setFotoPreview,fotoUrl,setFotoUrl,ppFile,setPpFile,ppPreview,setPpPreview,ppUrl,setPpUrl,loading,onGenerate,err}:{nama:string;setNama:(v:string)=>void;user:string;setUser:(v:string)=>void;fotoFile:File|null;setFotoFile:(v:File|null)=>void;fotoPreview:string;setFotoPreview:(v:string)=>void;fotoUrl:string;setFotoUrl:(v:string)=>void;ppFile:File|null;setPpFile:(v:File|null)=>void;ppPreview:string;setPpPreview:(v:string)=>void;ppUrl:string;setPpUrl:(v:string)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="IG Story IMG — Input" right="instagram story dengan gambar"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:"rgba(255,216,240,0.3)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>IG Story bergaya share post Instagram. Gambar postingan dan foto profil bisa upload atau URL. Keduanya opsional.</p></div>
    <IF label="Nama" value={nama} onChange={setNama} placeholder="Someone" maxLength={40}/>
    <IF label="Username" value={user} onChange={setUser} placeholder="@someone" maxLength={30}/>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <LT>Foto Postingan (opsional)</LT>
      <PU file={fotoFile} preview={fotoPreview} onFile={f=>{setFotoFile(f);setFotoPreview(URL.createObjectURL(f));setFotoUrl("");}} onClear={()=>{setFotoFile(null);setFotoPreview("");}} label="Upload Foto Postingan"/>
      {!fotoFile&&<IF label="" value={fotoUrl} onChange={setFotoUrl} placeholder="https://... URL gambar postingan" maxLength={500}/>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <LT>Foto Profil (opsional)</LT>
      <PU file={ppFile} preview={ppPreview} onFile={f=>{setPpFile(f);setPpPreview(URL.createObjectURL(f));setPpUrl("");}} onClear={()=>{setPpFile(null);setPpPreview("");}} label="Upload Foto Profil"/>
      {!ppFile&&<IF label="" value={ppUrl} onChange={setPpUrl} placeholder="https://... URL foto profil" maxLength={500}/>}
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate IG Story IMG"/>
  </div></C>;}

function IQCDarkForm({time,setTime,text,setText,imgFile,setImgFile,imgPreview,setImgPreview,imgUrl,setImgUrl,loading,onGenerate,err}:{time:string;setTime:(v:string)=>void;text:string;setText:(v:string)=>void;imgFile:File|null;setImgFile:(v:File|null)=>void;imgPreview:string;setImgPreview:(v:string)=>void;imgUrl:string;setImgUrl:(v:string)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="IQC Dark — Input" right="chat bubble dark mode"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:"rgba(200,216,255,0.3)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>Chat bubble dark bergaya iPhone. Bisa gabungin gambar dan teks. Kalau tidak ada gambar maka hanya teks, kalau tidak ada teks maka hanya gambar.</p></div>
    <IF label="Waktu" value={time} onChange={setTime} placeholder="22.54" maxLength={10}/>
    <TA label="Teks Pesan (opsional)" value={text} onChange={setText} placeholder="Tulis pesan di sini..." maxLength={500} rows={3}/>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <LT>Gambar (opsional)</LT>
      <PU file={imgFile} preview={imgPreview} onFile={f=>{setImgFile(f);setImgPreview(URL.createObjectURL(f));setImgUrl("");}} onClear={()=>{setImgFile(null);setImgPreview("");}} label="Upload Gambar"/>
      {!imgFile&&<IF label="" value={imgUrl} onChange={setImgUrl} placeholder="https://... URL gambar" maxLength={500}/>}
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate IQC Dark"/>
  </div></C>;}

function WafatForm({nama,setNama,tgl,setTgl,pesan,setPesan,foto,setFoto,preview,setPreview,loading,onGenerate,err}:{nama:string;setNama:(v:string)=>void;tgl:string;setTgl:(v:string)=>void;pesan:string;setPesan:(v:string)=>void;foto:File|null;setFoto:(v:File|null)=>void;preview:string;setPreview:(v:string)=>void;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="Ucapan Wafat — Input" right="kartu berita duka"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
    <div style={{padding:"10px 14px",background:"rgba(208,208,208,0.3)",border:"2px solid var(--ink)",borderRadius:"var(--radius-sm)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>Generate kartu ucapan berita wafat. Foto almarhum opsional.</p></div>
    <IF label="Nama Almarhum / Almarhumah" value={nama} onChange={setNama} placeholder="Nama Almarhum" maxLength={40}/>
    <IF label="Tanggal (opsional)" value={tgl} onChange={setTgl} placeholder="12 Juni 2025" maxLength={40}/>
    <TA label="Pesan / Doa (opsional)" value={pesan} onChange={setPesan} placeholder="Innalillahi wa inna ilaihi roji'un..." maxLength={200} rows={3}/>
    <PU file={foto} preview={preview} onFile={f=>{setFoto(f);setPreview(URL.createObjectURL(f));}} onClear={()=>{setFoto(null);setPreview("");}} label="Foto Almarhum (opsional)"/>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate Ucapan Wafat"/>
  </div></C>;}

function PixelForm({file,setFile,preview,setPreview,level,setLevel,blockSz,loading,onGenerate,err}:{file:File|null;setFile:(v:File|null)=>void;preview:string;setPreview:(v:string)=>void;level:number;setLevel:(v:number)=>void;blockSz:number;loading:boolean;onGenerate:()=>void;err:string}){
  return<C><CH label="Pixel Art — Input" right="convert foto ke pixel art"/><div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
    <PU file={file} preview={preview} onFile={f=>{setFile(f);setPreview(URL.createObjectURL(f));}} onClear={()=>{setFile(null);setPreview("");}} label="Upload Gambar"/>
    <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><LT>Level Pixel</LT><span style={{fontSize:12,fontWeight:700,color:"var(--ink-soft)"}}>Level {level} · block {blockSz}px</span></div>
      <input type="range" min={1} max={40} value={level} onChange={e=>setLevel(Number(e.target.value))} style={{width:"100%",accentColor:"var(--ink)",height:4,cursor:"pointer"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--ink-muted)"}}>1 (halus)</span><span style={{fontSize:10,fontWeight:700,color:"var(--ink-muted)"}}>40 (kasar)</span></div>
      <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
        {[5,10,15,20,25,30,35,40].map(l=><button key={l} onClick={()=>setLevel(l)} style={{padding:"4px 10px",background:level===l?"var(--ink)":"var(--paper)",border:"2px solid var(--ink)",borderRadius:999,color:level===l?"var(--paper)":"var(--ink-muted)",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.13s"}}>{l}</button>)}
      </div>
    </div>
    <EB msg={err}/><GB loading={loading} onClick={onGenerate} label="▶  Generate Pixel Art"/>
  </div></C>;}

function FFLobbyTable({lobbies,dataLoading,selectedLobby,onSelect,page,totalPages,onPageChange}:{lobbies:LobbyItem[];dataLoading:boolean;selectedLobby:number|null;onSelect:(id:number)=>void;page:number;totalPages:number;onPageChange:(p:number)=>void}){
  return<div className="brutal-card fade-up" style={{marginBottom:24}}><CH label="Daftar Lobby FF" right={`${dataLoading?"—":"30"} lobby`}/>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
      <thead><tr>{["No","Preview","Nama","Status"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
      <tbody>{dataLoading?Array.from({length:5}).map((_,i)=>(
        <tr key={i} style={{borderBottom:"1px solid rgba(26,26,26,0.1)"}}>
          <td style={{padding:"10px 16px"}}><Sk w={24} h={14}/></td><td style={{padding:"10px 16px"}}><Sk w={110} h={62}/></td>
          <td style={{padding:"10px 16px"}}><Sk w={80} h={14}/></td><td style={{padding:"10px 16px"}}><Sk w={50} h={20}/></td>
        </tr>)):lobbies.map((lb,idx)=>{const sel=selectedLobby===lb.id;return(
        <tr key={lb.id} onClick={()=>onSelect(lb.id)} style={{background:sel?"rgba(255,224,102,0.35)":idx%2===0?"var(--paper)":"var(--cream)",cursor:"pointer",borderBottom:"1px solid rgba(26,26,26,0.1)",transition:"background 0.12s",outline:sel?"2px solid var(--ink)":"none",outlineOffset:"-2px"}}
          onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLTableRowElement).style.background="rgba(26,26,26,0.04)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=sel?"rgba(255,224,102,0.35)":idx%2===0?"var(--paper)":"var(--cream)";}}>
          <td style={{padding:"8px 16px",fontSize:13,fontWeight:800,color:sel?"var(--ink)":"var(--ink-muted)"}}>{String(lb.id).padStart(2,"0")}</td>
          <td style={{padding:"7px 16px"}}><div style={{width:110,height:62,borderRadius:"var(--radius-sm)",overflow:"hidden",border:`2px solid ${sel?"var(--ink)":"rgba(26,26,26,0.2)"}`,boxShadow:sel?"2px 2px 0 0 var(--ink)":"none"}}><img src={lb.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} draggable={false}/></div></td>
          <td style={{padding:"8px 16px",fontSize:14,fontWeight:700,color:sel?"var(--ink)":"var(--ink-soft)"}}>Lobby {lb.id}</td>
          <td style={{padding:"8px 16px"}}>{sel?<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",background:"var(--ink)",border:"2px solid var(--ink)",borderRadius:999,color:"var(--paper)",fontSize:10,fontWeight:800}}>{I.chk} DIPILIH</span>:<span style={{fontSize:12,color:"rgba(26,26,26,0.2)",fontWeight:600}}>—</span>}</td>
        </tr>);})}
      </tbody></table></div>
    <Pag page={page} total={totalPages} onChange={onPageChange}/>
  </div>;}

function MLBorderTable({borders,dataLoading,ranks,selectedBorder,onSelect,page,totalPages,onPageChange,currentRank}:{borders:BorderItem[];dataLoading:boolean;ranks:RankItem[];selectedBorder:number;onSelect:(id:number)=>void;page:number;totalPages:number;onPageChange:(p:number)=>void;currentRank?:RankItem}){
  return<>
    <div className="brutal-card fade-up" style={{marginBottom:20}}><CH label="Rank Tersedia" right={`${ranks.length} rank`}/>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
        <thead><tr>{["Key","Icon","Nama Rank","Warna"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
        <tbody>{dataLoading?Array.from({length:4}).map((_,i)=>(<tr key={i}>{[24,40,80,60].map((w,j)=><td key={j} style={{padding:"10px 16px"}}><Sk w={w} h={14}/></td>)}</tr>)):ranks.map((r,idx)=>{const active=currentRank?.key===r.key;return(
          <tr key={r.key} style={{background:active?"rgba(255,224,102,0.3)":idx%2===0?"var(--paper)":"var(--cream)",borderBottom:"1px solid rgba(26,26,26,0.1)",outline:active?"2px solid var(--ink)":"none",outlineOffset:"-2px"}}>
            <td style={{padding:"10px 16px",fontSize:12,fontWeight:800,color:active?"var(--ink)":"var(--ink-muted)",fontFamily:"monospace"}}>{r.key}</td>
            <td style={{padding:"8px 16px"}}><img src={`/ml/rank/${r.key}.webp`} alt={r.label} style={{width:36,height:36,objectFit:"contain",display:"block"}} draggable={false}/></td>
            <td style={{padding:"10px 16px",fontSize:14,fontWeight:700,color:active?"var(--ink)":"var(--ink-soft)"}}>{r.label}</td>
            <td style={{padding:"10px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",background:r.color,border:"2px solid var(--ink)",flexShrink:0}}/><span style={{fontSize:11,fontWeight:700,color:"var(--ink-soft)",fontFamily:"monospace"}}>{r.color}</span>{active&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",background:"var(--ink)",borderRadius:999,fontSize:9,color:"var(--paper)",fontWeight:800}}>{I.chk} AKTIF</span>}</div></td>
          </tr>);})}
        </tbody></table></div>
    </div>
    <div className="brutal-card fade-up" style={{marginBottom:20}}><CH label="Daftar Border" right={`${dataLoading?"—":"16"} border`}/>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:380}}>
        <thead><tr>{["No","Preview","Nama","Status"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
        <tbody>{dataLoading?Array.from({length:4}).map((_,i)=>(<tr key={i}>{[24,60,80,50].map((w,j)=><td key={j} style={{padding:"10px 16px"}}><Sk w={w} h={14}/></td>)}</tr>)):borders.map((b,idx)=>{const sel=selectedBorder===b.id;return(
          <tr key={b.id} onClick={()=>onSelect(b.id)} style={{background:sel?"rgba(168,208,240,0.35)":idx%2===0?"var(--paper)":"var(--cream)",cursor:"pointer",borderBottom:"1px solid rgba(26,26,26,0.1)",transition:"background 0.12s",outline:sel?"2px solid var(--ink)":"none",outlineOffset:"-2px"}}
            onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLTableRowElement).style.background="rgba(26,26,26,0.04)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=sel?"rgba(168,208,240,0.35)":idx%2===0?"var(--paper)":"var(--cream)";}}>
            <td style={{padding:"8px 16px",fontSize:13,fontWeight:800,color:sel?"var(--ink)":"var(--ink-muted)"}}>{String(b.id).padStart(2,"0")}</td>
            <td style={{padding:"7px 16px"}}><div style={{width:56,height:56,borderRadius:"var(--radius-sm)",overflow:"hidden",border:`2px solid ${sel?"var(--ink)":"rgba(26,26,26,0.2)"}`,background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:sel?"2px 2px 0 0 var(--ink)":"none"}}><img src={b.img} alt="" style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}} draggable={false}/></div></td>
            <td style={{padding:"8px 16px",fontSize:14,fontWeight:700,color:sel?"var(--ink)":"var(--ink-soft)"}}>Border {b.id}</td>
            <td style={{padding:"8px 16px"}}>{sel?<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",background:"var(--ink)",borderRadius:999,color:"var(--paper)",fontSize:10,fontWeight:800}}>{I.chk} DIPILIH</span>:<span style={{fontSize:12,color:"rgba(26,26,26,0.2)",fontWeight:600}}>—</span>}</td>
          </tr>);})}
        </tbody></table></div>
      <Pag page={page} total={totalPages} onChange={onPageChange}/>
    </div>
  </>;}

const OutputSection=({result,accentBg,onDownload,ref}:{result:GenResult;accentBg:string;onDownload:()=>void;ref:React.RefObject<HTMLDivElement|null>})=>{
  const[loaded,setLoaded]=useState(false);
  return<div ref={ref} className="brutal-card pop" style={{marginBottom:24,overflow:"hidden"}}>
    <CH label="Output"/>
    <div style={{padding:20,background:accentBg}}>
      <div style={{position:"relative",borderRadius:"var(--radius-md)",overflow:"hidden",border:"2px solid var(--ink)",background:"var(--paper)",boxShadow:"var(--shadow-brutal)",lineHeight:0}}>
        {!loaded&&<div className="skeleton" style={{width:"100%",minHeight:280}}/>}
        <img src={result.image} alt="output" onLoad={()=>setLoaded(true)} style={{width:"100%",display:"block",opacity:loaded?1:0,transition:"opacity 0.3s",objectFit:"contain"}} draggable={false}/>
        <div style={{position:"absolute",inset:0}}/>
      </div>
      <button onClick={onDownload} className="brutal-btn" style={{marginTop:16,width:"100%",padding:"13px 0",background:"var(--ink)",border:"2px solid var(--ink)",borderRadius:"var(--radius-md)",color:"var(--paper)",fontSize:13,fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"var(--shadow-brutal-sm)"}}>
        {I.dl} DOWNLOAD
      </button>
    </div>
  </div>;};
