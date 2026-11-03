import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,TAU,makeState,junctions,step,switchTrack,reverse,position,angleDistance,medal} from '../src/engine.js';

function advance(s,seconds){for(let t=0;t<seconds;t+=1/120)step(s,1/120);}
test('all nine constellations are connected and have distinct collectible locations',()=>{
  assert.equal(LEVELS.length,9);
  for(let i=0;i<LEVELS.length;i++){
    const s=makeState(i),seen=new Set([0]);
    for(let n=0;n<s.level.rings.length;n++)for(const g of s.gates){if(seen.has(g.a))seen.add(g.b);if(seen.has(g.b))seen.add(g.a);}
    assert.equal(seen.size,s.level.rings.length,`level ${i+1} connected`);
    assert.equal(s.gems.length,s.level.rings.length*3);
    for(const g of s.gems)for(const gate of s.gates){if(g.ring===gate.a||g.ring===gate.b)assert.ok(angleDistance(g.angle,gate.angle+(g.ring===gate.b?Math.PI:0))>=.22);}
  }
});
test('queued switch fires once at a junction, preserves position and flips circulation',()=>{
  const s=makeState(0);s.angle=TAU-.01;switchTrack(s);const before=position(s);step(s,.02);
  assert.equal(s.ring,1);assert.equal(s.dir,-1);assert.equal(s.armed,false);assert.equal(s.swaps,1);
  assert.ok(Math.hypot(before.x-position(s).x,before.y-position(s).y)<.03);
  advance(s,.3);assert.equal(s.swaps,1);
});
test('switch can be cancelled, and reversing works through angle wrap',()=>{
  const s=makeState(0);s.angle=.01;reverse(s);switchTrack(s);switchTrack(s);step(s,.03);
  assert.equal(s.ring,0);assert.ok(s.angle>6);assert.equal(s.dir,-1);
  switchTrack(s);s.angle=.01;step(s,.03);assert.equal(s.ring,1);assert.equal(s.dir,1);
});
test('collectibles count once and exit remains closed until all are collected',()=>{
  const s=makeState(0);s.ring=s.exit.ring;s.angle=s.exit.angle;step(s,.001);assert.equal(s.status,'playing');
  for(const gem of s.gems){s.ring=gem.ring;s.angle=gem.angle;step(s,.001);step(s,.001);}
  assert.equal(s.collected,s.gems.length);s.ring=s.exit.ring;s.angle=s.exit.angle;step(s,.001);assert.equal(s.status,'won');
  const elapsed=s.elapsed;step(s,.02);assert.equal(s.elapsed,elapsed);
});
test('collisions grant grace time, then end the stage at zero integrity',()=>{
  const s=makeState(2);s.ring=s.hazards[0].ring;s.invulnerable=0;s.angle=s.hazards[0].angle;step(s,.001);assert.equal(s.health,2);
  s.angle=s.hazards[0].angle;step(s,.001);assert.equal(s.health,2);
  for(let i=0;i<2;i++){s.invulnerable=0;s.angle=s.hazards[0].angle;step(s,.001);}
  assert.equal(s.health,0);assert.equal(s.status,'lost');
});
test('medals reflect completion, flawless navigation, and target time independently',()=>{
  const s=makeState(0);s.elapsed=20;assert.equal(medal(s),3);s.hits=1;assert.equal(medal(s),2);s.elapsed=40;assert.equal(medal(s),1);
});

test('recorded control-only playthroughs finish every level with hazards active',async()=>{
  const {readFile}=await import('node:fs/promises');
  const routes=JSON.parse(await readFile(new URL('./routes.json',import.meta.url),'utf8'));
  for(const route of routes){
    const s=makeState(route.index);let cursor=0;
    for(let frame=0;frame<Math.ceil((route.time+2)*60)&&s.status==='playing';frame++){
      while(route.actions[cursor]?.[0]===frame){route.actions[cursor++][1]==='reverse'?reverse(s):switchTrack(s);}
      step(s,1/60);
    }
    assert.equal(s.status,'won',`constellation ${route.index+1} can be finished`);
    assert.equal(s.hits,0,`constellation ${route.index+1} has a flawless route`);
  }
});
