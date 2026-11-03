// Original vector compositions, rasterized to the platform's PNG requirements.
// No external images or fonts are used.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const specs={icon:[1024,1024],cover:[1536,1024],banner:[3360,1680],poster:[1024,1536],splash:[1920,1080]};
function art(kind,w,h){
 const poster=kind==='poster',icon=kind==='icon',splash=kind==='splash';
 const scale=Math.min(w,h),r=scale*(icon?.21:poster?.15:splash?.145:.14);
 const cx=w*(icon||poster||splash?.5:.70),cy=h*(poster?.635:.5);
 const rings=icon?[[-.82,0],[.82,0]]:[[-1,0],[0,-Math.sqrt(3)],[1,0],[0,Math.sqrt(3)]];
 let shapes='';
 for(let i=0;i<120;i++){const x=((i*127.13+31)%997)/997*w,y=((i*233.7+51)%991)/991*h;shapes+=`<circle cx="${x}" cy="${y}" r="${i%9===0?1.7:.8}" fill="#75bcaf" opacity="${.16+(i%5)*.06}"/>`;}
 shapes+=`<circle cx="${cx}" cy="${cy}" r="${r*3.1}" fill="none" stroke="#21454b" stroke-width="1" stroke-dasharray="2 15"/><path d="M ${cx-r*3.4} ${cy} H ${cx+r*3.4} M ${cx} ${cy-r*3.2} V ${cy+r*3.2}" stroke="#26494d" stroke-width="1" stroke-dasharray="4 12"/>`;
 rings.forEach(([x,y],i)=>{
 const px=cx+x*r,py=cy+y*r;
 shapes+=`<circle cx="${px}" cy="${py}" r="${r+9}" fill="none" stroke="#284e51" stroke-width="1"/><circle cx="${px}" cy="${py}" r="${r}" fill="none" stroke="${i%2?'#497c78':'#7bc6b4'}" stroke-width="${scale*.0025}"/>`;
 for(let j=0;j<48;j++){const a=j*Math.PI/24,rr=r-(j%4===0?17:8);shapes+=`<path d="M ${px+Math.cos(a)*rr} ${py+Math.sin(a)*rr} L ${px+Math.cos(a)*(r-4)} ${py+Math.sin(a)*(r-4)}" stroke="#426e6c" stroke-width="1"/>`;}
 const points=[];
 for(let j=0;j<3;j++){const a=.5+j*Math.PI*2/3+i*.2,gx=px+Math.cos(a)*r,gy=py+Math.sin(a)*r,sz=scale*.009;points.push(`${gx},${gy}`);shapes+=`<circle cx="${gx}" cy="${gy}" r="${sz*2.2}" fill="#f3d28f" opacity=".07"/><path d="M ${gx} ${gy-sz} ${gx+sz} ${gy} ${gx} ${gy+sz} ${gx-sz} ${gy} Z" fill="#f3d28f"/>`;}
 shapes+=`<polygon points="${points.join(' ')}" fill="none" stroke="#c0a56e" stroke-width="1.3" opacity=".36"/>`;
 });
 const px=cx-r,py=cy+r,sz=scale*.025;
 shapes+=`<path d="M ${px+sz*2} ${py-2} Q ${px+r*.7} ${py} ${px+r*.94} ${py-r*.55}" fill="none" stroke="#71e6c7" stroke-width="${scale*.003}" opacity=".45"/><circle cx="${px}" cy="${py}" r="${sz*1.7}" fill="none" stroke="#7acebd" stroke-width="1.4" opacity=".5"/><path d="M ${px-sz} ${py} ${px+sz*.7} ${py-sz*.55} ${px+sz*.4} ${py} ${px+sz*.7} ${py+sz*.55} Z" fill="#f1f3dc"/>`;
 let title='';
 if(!icon&&!splash){const x=poster?w*.12:w*.09,y=poster?h*.18:h*.43,size=scale*(poster?.17:.175);title=`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" letter-spacing="${-size*.05}" fill="#e8ece2">Orbit</text><text x="${x}" y="${y+size*.88}" font-family="Georgia,serif" font-size="${size}" font-style="italic" letter-spacing="${-size*.05}" fill="#6bd6bf">Loom.</text>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="bg"><stop stop-color="#13383e"/><stop offset="1" stop-color="#08191f"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/>${shapes}${title}</svg>`;
}
await mkdir('.arcadible',{recursive:true});await mkdir('artifacts/art-source',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({deviceScaleFactor:1});
for(const [kind,[w,h]]of Object.entries(specs)){const svg=art(kind,w,h);await writeFile(`artifacts/art-source/${kind}.svg`,svg);await page.setViewportSize({width:w,height:h});await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);await page.screenshot({path:`.arcadible/${kind}.png`});console.log(`Rendered ${kind}: ${w} × ${h}`);}
await browser.close();
