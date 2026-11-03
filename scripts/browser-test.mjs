import {chromium} from 'playwright';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {plan} from '../tests/pilot.js';
import {wrap,angleDistance} from '../src/engine.js';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const routes=JSON.parse(await readFile('tests/routes.json','utf8'));
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await page.goto(base);await page.waitForFunction(()=>!!window.orbitLoom);await page.getByRole('button',{name:'Start weaving'}).click();
for(const route of routes){
  assert.equal((await page.evaluate(()=>window.orbitLoom.snapshot())).index,route.index);
  await page.evaluate(({pilot,wrapCode,distanceCode})=>{
    const wrap=eval(`(${wrapCode})`);
    const angleDistance=eval(`(${distanceCode})`);
    const TAU=Math.PI*2;
    const decide=eval(`(${pilot})`);
    window.testPilot=setInterval(()=>{
      const s=window.orbitLoom.snapshot();if(s.status!=='playing'||s.paused)return;
      const p=decide(s);if(!p)return;
      if(p.dir!==s.dir)document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX',key:'x',bubbles:true}));
      if(p.armed!==s.armed)document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));
    },100);
  },{pilot:plan.toString(),wrapCode:wrap.toString(),distanceCode:angleDistance.toString()});
  await page.clock.runFor(6000);
  await page.screenshot({path:`artifacts/stage-${route.index+1}.png`});
  for(let attempt=0;attempt<120;attempt++){if((await page.evaluate(()=>window.orbitLoom.snapshot())).status!=='playing')break;await page.clock.runFor(1000);}
  await page.evaluate(()=>clearInterval(window.testPilot));
  const s=await page.evaluate(()=>window.orbitLoom.snapshot());
  console.log(`Stage ${route.index+1}: ${s.status}, ${s.collected}/${s.total}, ${s.health} integrity`);
  assert.equal(s.status,'won',`browser route ${route.index+1}`);
  assert.ok(s.health>0,'stage finishes with integrity remaining');
  if(route.index<8)await page.getByRole('button',{name:'Weave the next',exact:true}).click();
}
await page.screenshot({path:'artifacts/complete.png'});
await page.getByRole('button',{name:'Explore your atlas',exact:true}).click();
assert.equal(await page.locator('.level-card:not(:disabled)').count(),9);
await page.reload();await page.waitForFunction(()=>!!window.orbitLoom);await page.getByRole('button',{name:'Continue weaving'}).waitFor();await page.getByRole('button',{name:'Explore constellations'}).click();
assert.equal(await page.locator('.level-card:not(:disabled)').count(),9,'progress persists on reload');
await page.locator('.level-card').nth(6).click();await page.clock.runFor(1500);
await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>window.orbitLoom.snapshot().elapsed);await page.clock.runFor(2000);assert.equal(await page.evaluate(()=>window.orbitLoom.snapshot().elapsed),frozen,'pause freezes simulation');await page.getByRole('button',{name:'Keep weaving'}).click();await page.keyboard.press('r');assert.ok((await page.evaluate(()=>window.orbitLoom.snapshot())).elapsed<.1);
await page.setViewportSize({width:390,height:844});await page.clock.runFor(800);await page.screenshot({path:'artifacts/phone.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
await page.getByRole('button',{name:'Queue switch',exact:false}).click();assert.equal((await page.evaluate(()=>window.orbitLoom.snapshot())).armed,true);const before=await page.evaluate(()=>window.orbitLoom.snapshot().dir);await page.getByRole('button',{name:'Reverse Change direction'}).click();assert.equal((await page.evaluate(()=>window.orbitLoom.snapshot())).dir,-before);
await page.setViewportSize({width:844,height:390});await page.clock.runFor(32);await page.screenshot({path:'artifacts/phone-landscape.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const mobile=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true,storageState:await page.context().storageState({indexedDB:true})});
const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base);await phone.getByRole('button',{name:'Continue weaving'}).waitFor();await phone.getByRole('button',{name:'Explore constellations'}).tap();
for(const index of [2,6,8]){await phone.locator('.level-card').nth(index).tap();await phone.waitForTimeout(1000);await phone.screenshot({path:`artifacts/stage-${index+1}-phone.png`});await phone.getByRole('button',{name:'Pause game'}).tap();await phone.getByRole('button',{name:'Constellation atlas',exact:true}).tap();}
assert.deepEqual(errors,[],'no uncaught browser errors');await browser.close();console.log('All browser checks passed.');
