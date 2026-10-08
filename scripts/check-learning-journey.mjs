import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
mkdirSync('artifacts/qa',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const results=[];
try {
for(const [width,height] of [[1440,900],[390,844],[320,740]].filter(([w])=>!process.argv[2]||w===Number(process.argv[2]))){
 const context=await browser.newContext({viewport:{width,height},...(width===1440?{recordVideo:{dir:'artifacts/qa',size:{width:960,height:600}}}:{})});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('hunmin-settings-v1',JSON.stringify({festivalMode:false,soundEnabled:true,volume:0.35})));
 await page.goto('http://127.0.0.1:5188');await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('배움확인');await page.locator('#nickname-form button').click();await page.locator('[data-action=enter-palace]').click();
 await page.locator('.journey-guide summary').click();if(!(await page.locator('.journey-guide').innerText()).includes('가상'))throw Error('Fictional guide missing');await page.locator('.journey-guide summary').click();
 // Use the movement controls before advancing to puzzle coverage.
 const before=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.player.position.z);
 if(width>700){await page.keyboard.down('ArrowUp');await page.waitForTimeout(450);await page.keyboard.up('ArrowUp');}
 else {const b=await page.locator('#joystick').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2-35);await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();}
 if(await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.player.position.z)>=before)throw Error('Movement control failed');
 const pickups=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.getPickups());
 for(const p of pickups){await page.evaluate(p=>window.__THREE_GAME_TEST_HOOKS__.setPlayer(p.x,p.z),p);await page.locator(width>700?'.interact':'.touch-interact').click();}
 async function restored(n){if(!(await page.locator('.journey-book-heading b').first().innerText()).includes(`${n} / 5`))throw Error('Wrong book progress '+n);await page.waitForFunction(n=>window.__THREE_GAME_DIAGNOSTICS__.restoration===n,n);}
 await restored(1);await page.screenshot({path:`artifacts/qa/journey-explore-${width}.png`});await page.locator('[data-action=next-stage]').click();
 for(const c of ['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ']){await page.locator(`[data-letter="${c}"]`).click();await page.locator(`[data-organ="${c}"]`).click();if(!(await page.locator('.journey-discovery').innerText()).includes(c))throw Error('Organ explanation missing');}
 await restored(2);await page.locator('.journey-discovery').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/qa/journey-organ-${width}.png`});await page.locator('[data-action=next-stage]').click();
 for(const c of ['ㆍ','ㅡ','ㅣ']){await page.locator(`[data-letter="${c}"]`).click();await page.locator(`[data-vowel="${c}"]`).click();}await restored(3);await page.locator('[data-action=next-stage]').click();
 for(const [i,y] of [52,25,52,52,82,25,14].entries()){await page.locator('#stroke-piece').click();await page.locator(`[data-stroke-y="${y}"]`).click();await page.locator('.journey-glyph .new-stroke').waitFor({state:'attached'});if(i===0){await page.locator('.journey-discovery').scrollIntoViewIfNeeded();await page.waitForTimeout(1700);const end=await page.locator('.new-stroke').evaluate(el=>getComputedStyle(el).strokeDashoffset);if(Number.parseFloat(end)>0.01)throw Error('Added stroke did not draw');}}
 const score=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot().scores.puzzle);await page.locator('[data-action=replay-discovery]').click();if(await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot().scores.puzzle)!==score)throw Error('Replay awards score');
 await restored(4);await page.locator('.journey-discovery').scrollIntoViewIfNeeded();await page.waitForTimeout(2450);if(Number.parseFloat(await page.locator('.new-stroke').evaluate(el=>getComputedStyle(el).strokeDashoffset))>0.01)throw Error('Final added stroke incomplete');await page.screenshot({path:`artifacts/qa/journey-stroke-${width}.png`});await page.locator('[data-action=next-stage]').click();
 for(const c of ['ㅎ','ㅏ','ㄴ','ㄱ','ㅡ','ㄹ'])await page.locator(`[data-jamo="${c}"]`).click();await restored(5);await page.locator('[data-action=next-stage]').click();await page.locator('[data-action=bonus]').click();await page.locator('[data-action=quiz-countdown]').click();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.advanceTime(3100));
 await page.locator('.quiz-panel').waitFor();const q=await page.evaluate(async()=>{const {questions}=await import('/src/data/questions.ts');const r=window.__THREE_GAME_TEST_HOOKS__.snapshot();return questions[r.quizOrder[r.quizIndex]];});await page.locator(`[data-answer="${(q.answer+1)%4}"]`).click();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.advanceTime(61000));await page.locator('.result-panel').waitFor();
 await page.reload();await page.locator('[data-action=resume]').click();await page.locator('[data-action=journal]').click();if(!(await page.locator('.journey-journal').innerText()).includes('5 / 5'))throw Error('Journal lost progress');await page.locator('.journey-review summary').click();if(!(await page.locator('.journey-review').innerText()).includes(q.explanation))throw Error('Wrong answer review lost');if(await page.locator('.journey-review a').getAttribute('href')!==q.source)throw Error('Review source missing');
 await page.screenshot({path:`artifacts/qa/journey-journal-${width}.png`});await page.locator('[data-action=close-modal]').click();await page.locator('[data-action=certificate]').click();await page.locator('#certificate-canvas').waitFor();
 const download=page.waitForEvent('download');await page.locator('[data-action=download]').click();await (await download).saveAs(`artifacts/qa/journey-certificate-${width}.png`);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);const metrics=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);if(errors.length||overflow)throw Error(JSON.stringify({errors,overflow}));
 results.push({width,score,restored:metrics.restoration,calls:metrics.calls,triangles:metrics.triangles,reviewId:q.id,certificate:true,overflow,errors});const video=page.video();await context.close();if(video)await video.saveAs(`artifacts/qa/journey-${width}.webm`);
}
console.log(JSON.stringify(results));
} finally {await browser.close();}
