import { chromium } from '@playwright/test';
const url='https://seominho2026-tech.github.io/hangul/';const browser=await chromium.launch({channel:'chrome'});const results=[];
for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const response=await page.goto(url);if(response.status()!==200)throw Error('HTTP '+response.status());
 await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('배포확인');await page.locator('#nickname-form button').click();await page.locator('[data-action=enter-palace]').click();await page.locator('.inventory').waitFor();
 if(width>700){await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');}else{const r=await page.locator('#joystick').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2-30);await page.mouse.down();await page.waitForTimeout(400);await page.mouse.up();}
 const state=await page.evaluate(()=>({canvas:!!document.querySelector('#world'),credit:document.querySelector('.creator-credit').textContent,overflow:document.documentElement.scrollWidth>innerWidth,hooks:!!window.__THREE_GAME_TEST_HOOKS__}));if(state.overflow||state.hooks||errors.length)throw Error(JSON.stringify({state,errors}));
 await page.screenshot({path:`artifacts/qa/public-${width}.png`});results.push({width,status:response.status,...state,errors});await page.close();
}console.log(JSON.stringify(results));await browser.close();
