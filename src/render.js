import {TAU, position} from './engine.js';
export const C={bg:'#08191f',mint:'#6bd6bf',gold:'#f3d28f',coral:'#fa8e7a',line:'#294b53',dim:'#577a7e',white:'#eff4e7'};
const reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export function fit(canvas) {
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(canvas.width!==w||canvas.height!==h) {canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w:rect.width,h:rect.height};
}
function circle(ctx,x,y,r,color,width=1) {ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function dot(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
function diamond(ctx,x,y,r,color,fill=true){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.4;fill?ctx.fill():ctx.stroke();}
export function background(ctx,w,h,t=0) {
  ctx.clearRect(0,0,w,h);
  const gradient=ctx.createRadialGradient(w*.5,h*.47,0,w*.5,h*.47,Math.max(w,h)*.65);gradient.addColorStop(0,'#103038');gradient.addColorStop(1,C.bg);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  for(let i=0;i<85;i++){const x=((i*127.13+31)%997)/997*w,y=((i*233.7+51)%991)/991*h;ctx.globalAlpha=.18+(i%5)*.08;dot(ctx,x,y,i%9===0?1.3:.6,C.mint);}ctx.globalAlpha=1;
}
export function draw(canvas,s,time,trail=[],particles=[],hero=false) {
  const {ctx,w,h}=fit(canvas);if(!w||!h)return;
  background(ctx,w,h,time);
  const rings=s.level.rings;
  const minX=Math.min(...rings.map(r=>r[0]))-1.4,maxX=Math.max(...rings.map(r=>r[0]))+1.4;
  const minY=Math.min(...rings.map(r=>r[1]))-1.4,maxY=Math.max(...rings.map(r=>r[1]))+1.4;
  const scale=Math.min(w/(maxX-minX),h/(maxY-minY),hero?135:125);
  const ox=w/2-(maxX+minX)/2*scale,oy=h/2-(maxY+minY)/2*scale;
  const at=(x,y)=>[ox+x*scale,oy+y*scale];
  // Fine crosshairs anchor the drawing like an old navigational instrument.
  ctx.strokeStyle='#22434a';ctx.lineWidth=.65;ctx.setLineDash([2,7]);
  ctx.beginPath();ctx.moveTo(w/2,18);ctx.lineTo(w/2,h-18);ctx.stroke();ctx.setLineDash([]);
  rings.forEach(([x,y],i)=>{
    const [px,py]=at(x,y),active=i===s.ring;
    const complete=s.gems.filter(g=>g.ring===i).every(g=>g.taken);
    circle(ctx,px,py,scale+5,active?'#315d61':'#18363d',.6);
    circle(ctx,px,py,scale,complete?'#529b87':active?'#659b9b':C.line,active?1.8:1.4);
    ctx.strokeStyle=active?'#335b60':'#1d3e46';ctx.lineWidth=.7;
    for(let k=0;k<48;k++){const a=k*TAU/48,r=scale-(k%4===0?10:5);ctx.beginPath();ctx.moveTo(px+Math.cos(a)*r,py+Math.sin(a)*r);ctx.lineTo(px+Math.cos(a)*(scale-3),py+Math.sin(a)*(scale-3));ctx.stroke();}
    ctx.fillStyle=active?'#b7cfc5':'#52777b';ctx.textAlign='center';ctx.font=`${Math.max(11,scale*.18)}px Georgia`;ctx.fillText(String(i+1).padStart(2,'0'),px,py+4);
    ctx.font=`${Math.max(6,scale*.065)}px monospace`;ctx.fillStyle='#52777b';ctx.fillText(complete?'WOVEN':active?'SHUTTLE':'ORBIT',px,py+18);
    ctx.strokeStyle='#35565c';ctx.beginPath();ctx.moveTo(px-4,py-20);ctx.lineTo(px+4,py-20);ctx.moveTo(px,py-24);ctx.lineTo(px,py-16);ctx.stroke();
  });
  // Collected starlight leaves behind the constellation you made.
  const collected=s.gems.filter(g=>g.taken);
  if(collected.length>1){ctx.strokeStyle='#b99c5d';ctx.globalAlpha=.22;ctx.lineWidth=1;ctx.beginPath();collected.forEach((g,i)=>{const r=rings[g.ring],[x,y]=at(r[0]+Math.cos(g.angle),r[1]+Math.sin(g.angle));i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.globalAlpha=1;}
  s.gates.forEach(g=>{const [x,y]=at(g.x,g.y),active=s.armed&&(g.a===s.ring||g.b===s.ring);dot(ctx,x,y,6,C.bg);diamond(ctx,x,y,active?6:4,active?C.gold:'#789f9e',false);if(active)circle(ctx,x,y,11+(reduced?0:Math.sin(time*4)*2),'#b89e64',.8);});
  for(const g of s.gems){const r=rings[g.ring],[x,y]=at(r[0]+Math.cos(g.angle),r[1]+Math.sin(g.angle));
    if(g.taken){dot(ctx,x,y,2,'#8a8d63');continue;}
    ctx.shadowBlur=14;ctx.shadowColor=C.gold;diamond(ctx,x,y,Math.max(4,scale*.055),C.gold);ctx.shadowBlur=0;
    ctx.strokeStyle='#a48c54';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x-6,y);ctx.moveTo(x+6,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-9);ctx.lineTo(x,y-6);ctx.stroke();
  }
  const exitRing=rings[s.exit.ring],[ex,ey]=at(exitRing[0]+Math.cos(s.exit.angle),exitRing[1]+Math.sin(s.exit.angle)),open=s.collected===s.gems.length;
  dot(ctx,ex,ey,11,C.bg);diamond(ctx,ex,ey,10,open?C.mint:'#4b6d6e',false);diamond(ctx,ex,ey,5,open?C.mint:'#4b6d6e',open);
  if(open){ctx.shadowBlur=20;ctx.shadowColor=C.mint;circle(ctx,ex,ey,17+(reduced?0:Math.sin(time*3)*3),C.mint);ctx.shadowBlur=0;}
  for(const hazard of s.hazards){const r=rings[hazard.ring],[x,y]=at(r[0]+Math.cos(hazard.angle),r[1]+Math.sin(hazard.angle));ctx.save();ctx.translate(x,y);ctx.rotate(time*1.4);ctx.shadowBlur=12;ctx.shadowColor=C.coral;ctx.strokeStyle=C.coral;ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<8;k++){const a=k*TAU/8,r=k%2?3:8;k?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.stroke();ctx.restore();}
  if(!reduced)trail.forEach((p,i)=>{const [x,y]=at(p.x,p.y);dot(ctx,x,y,1.5+i/trail.length*2,`rgba(107,214,191,${i/trail.length*.5})`);});
  if(!s.invulnerable||Math.floor(time*12)%2||s.elapsed<1.1){const p=position(s),[x,y]=at(p.x,p.y);ctx.save();ctx.translate(x,y);ctx.rotate(s.angle+(s.dir===1?Math.PI/2:-Math.PI/2));ctx.shadowBlur=22;ctx.shadowColor=C.mint;ctx.fillStyle=C.white;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.restore();circle(ctx,x,y,15,s.armed?'#f3d28f70':'#6bd6bf35',1);}
  for(const p of particles){const [x,y]=at(p.x,p.y);ctx.globalAlpha=Math.max(0,p.life);dot(ctx,x,y,p.size||2,p.color);ctx.globalAlpha=1;}
  if(s.armed){ctx.fillStyle=C.gold;ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('SWITCH QUEUED',w/2,h-10);}
}
