import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:5188');await page.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);
for(const state of ['title','result']){await page.evaluate(s=>window.__THREE_GAME_TEST_HOOKS__.setState(s),state);const text=await page.locator('#ui').innerText();if(/[a-z]{2,}/i.test(text))throw Error(text);}
await page.locator('[data-action=ranking]').click();const text=await page.locator('#ui').innerText();if(/[a-z]{2,}/i.test(text))throw Error(text);console.log('Ranking Korean labels verified');
await page.evaluate(()=>{window.__THREE_GAME_TEST_HOOKS__.setState('active-play');window.__THREE_GAME_TEST_HOOKS__.setPlayer(-8,10);document.activeElement.blur();});await page.keyboard.press('Space');const run=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot());if(!run.collected.includes('ㄱ'))throw Error('Space pickup failed');
await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('title'));await page.screenshot({path:'artifacts/qa/korean-mobile.png'});console.log({spacePickup:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await browser.close();

