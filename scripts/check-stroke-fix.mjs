import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage();
await page.goto('http://127.0.0.1:5188');await page.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);
for(const [width,height] of [[1440,900],[390,844]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('stroke'));
 for(const [i,y] of [52,25,52,52,82,25,14].entries()){
 const offset=await page.locator(`[data-stroke-y="${y}"]`).evaluate((el,y)=>{const b=el.parentElement.getBoundingClientRect(),r=el.getBoundingClientRect();return Math.abs(r.y+r.height/2-(b.y+1+(b.height-2)*y/100));},y);
 if(offset>1)throw Error(`Misaligned ${i}: ${offset}`);
 if(i===3)await page.screenshot({path:`artifacts/qa/stroke-fixed-${width}.png`});
 await page.locator('#stroke-piece').click();await page.locator(`[data-stroke-y="${y}"]`).click();
 }
 const r=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.snapshot());if(r.scores.puzzle!==1400)throw Error('Score mismatch');console.log(`${width}: 7 aligned targets and 7 correct answers`);
}
const school=await page.evaluate(async()=>{const {gameConfig}=await import('/src/config/gameConfig.ts');const {createCertificate}=await import('/src/certificate/CertificateGenerator.ts');const lines=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){lines.push(text);return original.call(this,text,...args)};try{await createCertificate('확인',1400,'한글 지킴이',gameConfig.schoolName,'');}finally{CanvasRenderingContext2D.prototype.fillText=original}return lines.includes('대전성모여자고등학교');});if(!school)throw Error('School missing');console.log('Certificate school verified');await browser.close();
