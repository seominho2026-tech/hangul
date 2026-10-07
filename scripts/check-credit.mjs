import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5188');
const results=[];
for(const [width,height] of [[1440,900],[390,844],[320,740],[844,390]]){
 await page.setViewportSize({width,height});
 results.push(await page.locator('.creator-credit').evaluate(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,width:innerWidth,height:innerHeight,visible:r.width>0&&r.height>0,withinViewport:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};}));
}
console.log(JSON.stringify(results));await browser.close();
