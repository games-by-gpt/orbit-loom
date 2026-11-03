import {wrap,angleDistance} from "../src/engine.js";
export function plan(s){
 const nodes=[{ring:s.ring,angle:s.angle,start:true}];
 for(const g of s.gates){const n=nodes.length;nodes.push({ring:g.a,angle:wrap(g.angle),pair:n+1},{ring:g.b,angle:wrap(g.angle+Math.PI),pair:n});}
 const remaining=s.gems.filter(g=>!g.taken);
 for(const g of remaining.length?remaining:[s.exit])nodes.push({...g,goal:true});
 const dist=nodes.map(()=>Infinity),prev=[],edge=[];dist[0]=0;const seen=new Set();
 let end;
 for(let i=0;i<nodes.length;i++){
  let a=-1;for(let j=0;j<nodes.length;j++)if(!seen.has(j)&&(a<0||dist[j]<dist[a]))a=j;
  if(a<0||!Number.isFinite(dist[a]))break;if(nodes[a].goal){end=a;break;}seen.add(a);
  for(let b=1;b<nodes.length;b++)if(a!==b){
   const na=nodes[a],nb=nodes[b];let options=[];
   if(na.pair===b)options.push({cost:.03,dir:0,transfer:true});
   if(na.ring===nb.ring){for(const dir of [-1,1]){
    const travel=wrap((nb.angle-na.angle)*dir),seconds=travel/s.speed;let cost=seconds;
    for(const h of s.hazards.filter(h=>h.ring===na.ring)){
     for(let t=0;t<=seconds;t+=.1){const pa=na.angle+dir*t*s.speed,ha=h.angle+h.speed*(dist[a]+t);if(angleDistance(pa,ha)<.3){cost+=12;break;}}
    }
    options.push({cost,dir,transfer:false});
   }}
   for(const o of options)if(dist[a]+o.cost<dist[b]){dist[b]=dist[a]+o.cost;prev[b]=a;edge[b]=o;}
  }
 }
 if(end===undefined)return null;const route=[];for(let n=end;n;n=prev[n])route.unshift({from:nodes[prev[n]],to:nodes[n],...edge[n]});
 const first=route.find(r=>r.dir);if(!first)return null;
 let transfer=null;for(const r of route){if(r.transfer){transfer=r;break;}if(r.to.goal)break;}
 const gate=transfer?.from;
 const next=s.gates.filter(g=>g.a===s.ring||g.b===s.ring).map(g=>({angle:wrap(g.angle+(g.b===s.ring?Math.PI:0))})).sort((a,b)=>wrap((a.angle-s.angle)*first.dir)-wrap((b.angle-s.angle)*first.dir))[0];
 return {dir:first.dir,armed:!!gate&&gate.ring===s.ring&&angleDistance(next.angle,gate.angle)<.01};
}
