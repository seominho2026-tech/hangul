import { test, expect, type Page } from '@playwright/test';
import { questions } from '../src/data/questions';
import { freshRun, loadRun, RUN_KEY } from '../src/core/RunState';
import { LocalRankingService, seoulDay } from '../src/ranking/RankingService';
const snap=(p:Page)=>p.evaluate(()=> (window as any).__THREE_GAME_TEST_HOOKS__.snapshot());
const advance=(p:Page,ms:number)=>p.evaluate(n=>(window as any).__THREE_GAME_TEST_HOOKS__.advanceTime(n),ms);
async function moveTo(p:Page,x:number,z:number){
 for(let step=0;step<60;step++){
  const pos=await p.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player.position);
  const dx=x-pos.x,dz=z-pos.z;if(Math.hypot(dx,dz)<1.4)return;
  const key=Math.abs(dx)>Math.abs(dz)?dx>0?'d':'a':dz>0?'s':'w';
  await p.keyboard.down(key);await p.waitForTimeout(Math.min(350,Math.max(70,Math.max(Math.abs(dx),Math.abs(dz))/5.4*1000)));await p.keyboard.up(key);
 }
 throw Error('Could not reach pickup');
}
test('whole journey, real movement, puzzles, timer, certificate and reset',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('/');await expect(page.locator('[data-action=start]')).toBeVisible();
 await page.screenshot({path:`artifacts/qa/${info.project.name}-title.png`});
 await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('한글사랑');await page.locator('#nickname-form button').click();await page.locator('[data-action=enter-palace]').click();
 await expect(page.locator('.inventory')).toContainText('0 / 5');
 if(info.project.name==='mobile'){
  const box=(await page.locator('#joystick').boundingBox())!;
  const before=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player.position.z);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2-38);await page.mouse.down();await page.waitForTimeout(500);await page.mouse.up();
  const after=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player.position.z);expect(after).toBeLessThan(before-.5);
 }
 const points=await page.evaluate(()=>(window as any).__THREE_GAME_TEST_HOOKS__.getPickups());
 for(const pt of points){await moveTo(page,pt.x,pt.z);await page.keyboard.press('e');await expect(page.locator('.inventory .found')).toHaveCount(points.indexOf(pt)+1);}
 await page.screenshot({path:`artifacts/qa/${info.project.name}-collected.png`});
 expect((await snap(page)).scores.exploration).toBe(500);
 await page.keyboard.press('e');expect((await snap(page)).scores.exploration).toBe(500);
 await page.locator('[data-action=next-stage]').click();
 await page.locator('[data-letter="ㄱ"]').click();await page.locator('[data-organ="ㅁ"]').click();await expect(page.locator('#puzzle-feedback')).toContainText('입');expect((await snap(page)).scores.puzzle).toBe(0);
 await page.screenshot({path:`artifacts/qa/${info.project.name}-puzzle.png`});
 for(const c of ['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ']){await page.locator(`[data-letter="${c}"]`).click();await page.locator(`[data-organ="${c}"]`).click();}
 await page.locator('[data-action=next-stage]').click();
 for(const c of ['ㆍ','ㅡ','ㅣ']){await page.locator(`[data-letter="${c}"]`).click();await page.locator(`[data-vowel="${c}"]`).click();}
 await page.locator('[data-action=next-stage]').click();
 await page.screenshot({path:`artifacts/qa/${info.project.name}-stroke.png`});
 for(const [i,y] of [52,25,52,52,82,25,14].entries()){
  if(i===0){const from=(await page.locator('#stroke-piece').boundingBox())!,to=(await page.locator(`[data-stroke-y="${y}"]`).boundingBox())!;await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();}
  else{await page.locator('#stroke-piece').click();await page.locator(`[data-stroke-y="${y}"]`).click();}
 }
 await page.locator('[data-action=next-stage]').click();
 for(const c of ['ㅎ','ㅏ','ㄴ','ㄱ','ㅡ','ㄹ'])await page.locator(`[data-jamo="${c}"]`).click();
 await expect(page.locator('.assembled-word')).toHaveText('한글');expect((await snap(page)).scores.puzzle).toBe(4000);
 await page.locator('[data-action=next-stage]').click();await expect(page.locator('.restore')).toContainText('28자');
 await page.locator('[data-action=bonus]').click();await page.locator('[data-action=quiz-countdown]').click();await advance(page,3100);await expect(page.locator('.quiz-panel')).toBeVisible();
 for(let i=0;i<10;i++){const r=await snap(page),q=questions[r.quizOrder[r.quizIndex%r.quizOrder.length]];await page.locator(`[data-answer="${q.answer}"]`).click();await advance(page,1200);await expect(page.locator('[data-answer="0"]')).toBeEnabled();}
 let r=await snap(page);expect(r.scores.quiz).toBe(1000);expect(r.scores.combo).toBe(400);expect(r.combo).toBe(10);
 const q=questions[r.quizOrder[r.quizIndex%r.quizOrder.length]];await page.locator(`[data-answer="${(q.answer+1)%4}"]`).click();r=await snap(page);expect(r.combo).toBe(0);expect(r.scores.quiz).toBe(1000);
 await advance(page,61000);await expect(page.locator('.result-panel')).toBeVisible();r=await snap(page);expect(r.scores.completion).toBe(1000);expect(Object.values(r.scores).reduce((a:any,b:any)=>a+b,0)).toBe(7400);
 await page.screenshot({path:`artifacts/qa/${info.project.name}-result.png`});
 await page.locator('[data-action=certificate]').click();await expect(page.locator('#certificate-canvas')).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-action=download]').click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/한글지킴이.*png/);await download.saveAs(`artifacts/qa/${info.project.name}-certificate.png`);
 await page.locator('[data-action=ranking]').click();await expect(page.locator('.rankings')).toContainText('한글사랑');await expect(page.locator('.rankings')).toContainText('7,400');
 await page.evaluate(()=>(window as any).__THREE_GAME_TEST_HOOKS__.setIdle(31));await expect(page.locator('[data-action=start]')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('hunmin-run-v1'))).toBeNull();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hunmin-ranking-v1')||'[]').length)).toBe(1);
 await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('두번째');await page.locator('#nickname-form button').click();expect((await snap(page)).scores.exploration).toBe(0);
 expect(errors).toEqual([]);
});
test('refresh recovery, leaderboard navigation, invalid data, and responsive bounds',async({page},info)=>{
 await page.goto('/');await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('저장시험');await page.locator('#nickname-form button').click();await page.locator('[data-action=enter-palace]').click();await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');await page.waitForTimeout(2200);
 await page.reload();await expect(page.locator('[data-action=resume]')).toBeVisible();await page.locator('[data-action=ranking]').click();await page.locator('[data-action=home]').click();await expect(page.locator('[data-action=resume]')).toBeVisible();await page.locator('[data-action=resume]').click();await expect(page.locator('.inventory')).toContainText('0 / 5');
 const sizes=info.project.name==='desktop'?[[1280,720],[1024,768]]:[[390,844],[844,390],[320,740]];
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.screenshot({path:`artifacts/qa/layout-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
});
test('content and ranking validation',()=>{
 expect(questions).toHaveLength(50);for(const q of questions){expect(q.choices).toHaveLength(4);expect(new Set(q.choices).size).toBe(4);expect(q.answer).toBeGreaterThanOrEqual(0);expect(q.answer).toBeLessThan(4);}
 const data=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)},configurable:true});
 expect(seoulDay('2026-10-06T15:00:00Z')).toBe('2026-10-07');
 const ranking=new LocalRankingService();for(let i=0;i<12;i++)ranking.save({id:String(i),nickname:'시험',score:i*100,title:'지킴이',date:new Date().toISOString()});expect(ranking.list(true)).toHaveLength(12);expect(ranking.list(true)[0].score).toBe(1100);ranking.save({id:'11',nickname:'시험',score:1200,title:'지킴이',date:new Date().toISOString()});expect(ranking.list().length).toBe(12);
 const run=freshRun();run.phase='BONUS_QUIZ';run.nickname='시험';run.quizOrder=[];data.set(RUN_KEY,JSON.stringify(run));expect(loadRun()).toBeNull();
 const legacy=freshRun();legacy.phase='STAGE2';legacy.nickname='이전기록';delete legacy.quizMistakes;data.set(RUN_KEY,JSON.stringify(legacy));expect(loadRun()?.nickname).toBe('이전기록');expect(loadRun()?.quizMistakes).toBeUndefined();
 legacy.quizMistakes=[questions[0].id];data.set(RUN_KEY,JSON.stringify(legacy));expect(loadRun()?.quizMistakes).toEqual([questions[0].id]);
 legacy.quizMistakes=[-1];data.set(RUN_KEY,JSON.stringify(legacy));expect(loadRun()).toBeNull();
 ranking.clear(true);expect(ranking.list()).toHaveLength(0);
});
