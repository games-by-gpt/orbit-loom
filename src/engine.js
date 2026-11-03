// Deterministic simulation, independent of rendering and browser APIs.
export const TAU = Math.PI * 2;
const H = Math.sqrt(3);
export const LEVELS = [
  { name:'First thread', note:'Collect every spark. Queue a switch to cross the next junction.', rings:[[-1,0],[1,0]], hazards:[], par:24 },
  { name:'Three-body waltz', note:'A queued switch takes the NEXT junction. Choose your moment.', rings:[[-1,0],[1,0],[0,-H]], hazards:[], par:36 },
  { name:'A little friction', note:'Coral sparks burn. Reverse direction to give yourself room.', rings:[[-2,0],[0,0],[2,0]], hazards:[1], par:40 },
  { name:'Diamond in the dark', note:'Find a route through all four loops. Your thread remembers.', rings:[[-1,0],[0,-H],[1,0],[0,H]], hazards:[1], par:48 },
  { name:'The long way home', note:'Sometimes the shortest route is a change of direction.', rings:[[-2,0],[-1,-H],[1,-H],[2,0],[0,0]], hazards:[1,3], par:58 },
  { name:'Satellite garden', note:'Six petals, one golden thread. Leave no spark behind.', rings:[[0,0],[-2,0],[-1,-H],[1,-H],[2,0],[1,H]], hazards:[2,4], par:65 },
  { name:'Coral current', note:'Read the moving hazards. Switch early, reverse freely.', rings:[[-2,0],[-1,-H],[1,-H],[2,0],[1,H],[-1,H]], hazards:[1,3,5], par:75 },
  { name:'The heart of the loom', note:'The center connects everything. Use it to change your route.', rings:[[-2,0],[-1,-H],[1,-H],[2,0],[1,H],[-1,H],[0,0]], hazards:[1,3,5], par:85 },
  { name:'A small infinity', note:'One last constellation. Make something worth getting lost in.', rings:[[-3,0],[-2,-H],[0,-H],[2,-H],[3,0],[2,H],[0,H],[-2,H],[-1,0],[1,0]], hazards:[1,3,5,7], par:115 },
];
export const wrap = a => ((a % TAU) + TAU) % TAU;
export const angleDistance = (a,b) => Math.abs(((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI);
export function junctions(rings) {
  const gates=[];
  rings.forEach(([x,y],i)=>rings.forEach(([u,v],j)=>{
    if(j>i && Math.abs(Math.hypot(x-u,y-v)-2)<0.01) gates.push({a:i,b:j,angle:Math.atan2(v-y,u-x),x:(x+u)/2,y:(y+v)/2});
  }));
  return gates;
}
export function makeState(index) {
  const level=LEVELS[index];
  const gates=junctions(level.rings);
  const gems=[];
  level.rings.forEach((_,ring)=>{
    // Keep collectibles away from junctions so a transit cannot skip one.
    const gateAngles=gates.filter(g=>g.a===ring||g.b===ring).map(g=>wrap(g.angle+(g.b===ring?Math.PI:0)));
    for(let k=0;k<3;k++) {
      let angle=wrap(0.48+k*TAU/3+ring*0.31);
      for(let tries=0;tries<20 && gateAngles.some(g=>angleDistance(g,angle)<0.23);tries++) angle=wrap(angle+0.13);
      gems.push({ring,angle,taken:false});
    }
  });
  return { index,level,gates,gems,ring:0,angle:Math.PI/2,dir:1,speed:0.94+index*0.035,
    armed:false,cooldown:0,elapsed:0,health:3,hits:0,invulnerable:1.2,swaps:0,collected:0,
    status:'playing',exit:{ring:level.rings.length-1,angle:-Math.PI/2},
    hazards:level.hazards.map((ring,i)=>({ring,angle:wrap(3.4+i*1.6),speed:(i%2?-1:1)*(0.34+index*0.018)})),events:[] };
}
export function switchTrack(s) { if(s.status==='playing') s.armed=!s.armed; }
export function reverse(s) { if(s.status==='playing') {s.dir*=-1; s.events.push({type:'reverse'});} }
export function position(s) {const [x,y]=s.level.rings[s.ring];return {x:x+Math.cos(s.angle),y:y+Math.sin(s.angle)};}
export function step(s,dt) {
  if(s.status!=='playing') return;
  dt=Math.min(dt,0.04);
  s.elapsed+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);
  const previous=s.angle, travel=s.speed*dt;
  s.angle=wrap(previous+travel*s.dir);
  if(s.armed && s.cooldown===0) {
    for(const gate of s.gates) {
      if(gate.a!==s.ring && gate.b!==s.ring) continue;
      const target=wrap(gate.angle+(gate.b===s.ring?Math.PI:0));
      const distance=wrap((target-previous)*s.dir);
      if(distance<=travel+1e-9) {
        s.ring=gate.a===s.ring?gate.b:gate.a;
        s.dir*=-1;s.angle=wrap(target+Math.PI+(travel-distance)*s.dir);
        s.armed=false;s.cooldown=.25;s.swaps++;s.events.push({type:'switch',x:gate.x,y:gate.y});break;
      }
    }
  }
  for(const gem of s.gems) if(!gem.taken && gem.ring===s.ring && angleDistance(gem.angle,s.angle)<0.105) {
    gem.taken=true;s.collected++;s.events.push({type:'collect',ring:gem.ring,angle:gem.angle});
    if(s.collected===s.gems.length) s.events.push({type:'open'});
  }
  for(const hazard of s.hazards) {
    hazard.angle=wrap(hazard.angle+hazard.speed*dt);
    if(hazard.ring===s.ring && s.invulnerable===0 && angleDistance(hazard.angle,s.angle)<.145) {
      s.health--;s.hits++;s.invulnerable=2.3;s.events.push({type:'hit'});
      if(s.health<=0) {s.status='lost';s.events.push({type:'lost'});return;}
    }
  }
  if(s.collected===s.gems.length && s.ring===s.exit.ring && angleDistance(s.angle,s.exit.angle)<.14) {
    s.status='won';s.events.push({type:'won'});
  }
}
export function medal(s) {return 1+(s.hits===0?1:0)+(s.elapsed<=s.level.par?1:0);}
