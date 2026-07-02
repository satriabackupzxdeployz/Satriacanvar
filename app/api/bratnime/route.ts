import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const ASSETS = path.join(process.cwd(), "assets", "pack");
const FONTS  = path.join(ASSETS, "fonts");

const LEFT=275, RIGHT=1011, TOP_Y=574, BOTTOM_Y=1032;
const CENTER_X=(LEFT+RIGHT)/2, CENTER_Y=804;

let fl=false;
function ensureFonts(){if(fl)return;const f=path.join(FONTS,"bratnime.ttf");if(fs.existsSync(f))GlobalFonts.registerFromPath(f,"BratnimePop");fl=true;}

function wrap(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,text:string,mw:number):string[]{
  const w=text.split(" ");const lines:string[]=[];let cur="";
  for(const word of w){const t=cur?cur+" "+word:word;if((ctx.measureText(t) as{width:number}).width>mw&&cur){lines.push(cur);cur=word;}else cur=t;}
  if(cur)lines.push(cur);return lines;
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const text=String(body.text??"").trim().slice(0,120);
    if(!text)return NextResponse.json({error:"Parameter 'text' wajib diisi"},{status:400});
    ensureFonts();
    const bg=await loadImage(path.join(ASSETS,"bratnime","bg.jpg"));
    const canvas=createCanvas(bg.width,bg.height);
    const ctx=canvas.getContext("2d");
    ctx.drawImage(bg,0,0,bg.width,bg.height);
    const maxW=RIGHT-LEFT,maxH=BOTTOM_Y-TOP_Y;
    let sz=95,lines:string[]=[],lh=0,th=0;
    do{ctx.font=`${sz}px BratnimePop`;lines=wrap(ctx,text,maxW);lh=sz*1.15;th=lines.length*lh;sz-=2;}while(th>maxH&&sz>10);
    ctx.font=`${sz}px BratnimePop`;ctx.fillStyle="#000";ctx.textAlign="center";ctx.textBaseline="middle";
    const startY=CENTER_Y-(lines.length*lh/2)+(lh/2);
    lines.forEach((l,i)=>ctx.fillText(l,CENTER_X,startY+i*lh));
    const buf=canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf),{headers:{"Content-Type":"image/png","Content-Disposition":"inline; filename=\"bratnime.png\"","Cache-Control":"no-store"}});
  }catch(err:unknown){return NextResponse.json({error:err instanceof Error?err.message:"Error"},{status:500});}
}

export async function GET(req:NextRequest){
  const{searchParams}=new URL(req.url);
  const text=searchParams.get("text");
  if(!text?.trim())return NextResponse.json({error:"Parameter 'text' wajib diisi"},{status:400});
  return POST(new NextRequest(req.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})}));
}
