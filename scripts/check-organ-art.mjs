import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});const results=[];
for(const [width,height] of [[1440,900],[390,844],[320,740]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5188');await page.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('puzzle'));
 const images=await page.locator('.organ-illustration').count();if(images!==5)throw Error('Missing illustrations');await page.screenshot({path:`artifacts/qa/organs-${width}.png`,fullPage:true});
 await page.locator('[data-letter="ㄱ"]').click();await page.locator('[data-organ="ㅁ"]').click();if(!(await page.locator('#puzzle-feedback').innerText()).includes('입'))throw Error('Hint broken');
 for(const c of ['ㅁ','ㅇ','ㄱ','ㅅ','ㄴ']){await page.locator(`[data-letter="${c}"]`).click();await page.locator(`[data-organ="${c}"]`).click();}
 const r=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot());if(r.scores.puzzle!==1000)throw Error('Scoring broken');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(errors.length||overflow)throw Error(JSON.stringify({errors,overflow}));results.push({width,images,score:r.scores.puzzle,errors,overflow});await page.close();
}
console.log(JSON.stringify(results));await browser.close();
