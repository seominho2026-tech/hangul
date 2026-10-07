import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
const seed=await browser.newPage();
await seed.goto('http://127.0.0.1:5188');
await seed.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);
await seed.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('puzzle'));
const run=await seed.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot());
await seed.close();
const results=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assets=[];page.on('response',r=>{if(r.url().includes('education/vocal-tract.svg'))assets.push(r.status());});
 await page.addInitScript(r=>localStorage.setItem('hunmin-run-v1',JSON.stringify(r)),run);
 const response=await page.goto('https://seominho2026-tech.github.io/hangul/?v=anatomy-reference');
 await page.locator('[data-action=resume]').click();
 await page.locator('.organ-illustration image').first().waitFor();
 await page.locator('.organ-sources summary').click();
 if(await page.locator('.organ-sources a').count()!==5)throw Error('Source links missing');
 await page.locator('.organ-sources summary').click();
 await page.screenshot({path:`artifacts/qa/public-organs-${width}.png`});
 for(const c of ['ㅁ','ㅇ','ㄱ','ㅅ','ㄴ']){
  await page.locator(`[data-letter="${c}"]`).click();
  await page.locator(`[data-organ="${c}"]`).click();
 }
 await page.locator('[data-action=next-stage]').waitFor();
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,hooks:!!window.__THREE_GAME_TEST_HOOKS__}));
 if(errors.length||state.overflow||state.hooks||!assets.length||assets.some(x=>x!==200))throw Error(JSON.stringify({errors,state,assets}));
 results.push({width,status:response.status(),assets,completed:true,...state,errors});await page.close();
}
console.log(JSON.stringify(results));await browser.close();
