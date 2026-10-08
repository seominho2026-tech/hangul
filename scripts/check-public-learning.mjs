import {chromium} from '@playwright/test';
const url='https://seominho2026-tech.github.io/hangul/?v=0d4045a';
const browser=await chromium.launch({channel:'chrome'});const results=[];
try {
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{const target=sessionStorage.getItem('public-check-phase');if(!target)return;const r=JSON.parse(localStorage.getItem('hunmin-run-v1'));r.phase=target;r.collected=['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'];if(target==='RESULT'){r.solved=[...['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'].map(c=>'organ-'+c),...['ㆍ','ㅡ','ㅣ'].map(c=>'vowel-'+c),...Array.from({length:7},(_,i)=>'stroke-'+i),'word-한','word-글'];r.quizMistakes=[1];r.quizIndex=1;}localStorage.setItem('hunmin-run-v1',JSON.stringify(r));sessionStorage.removeItem('public-check-phase');});
  const response=await page.goto(url);if(response.status()!==200)throw Error('Public HTTP failure');
  const html=await response.text();if(!html.includes('index-TD0F5pqN.js'))throw Error('Old release still served');
  await page.locator('[data-action=start]').click();await page.locator('#nickname').fill('공개확인');await page.locator('#nickname-form button').click();await page.locator('[data-action=enter-palace]').click();
  await page.locator('.journey-guide summary').click();if(!(await page.locator('.journey-guide').innerText()).includes('가상'))throw Error('Guide unavailable');await page.locator('.journey-guide summary').click();
  // Seed only this isolated test browser's record to inspect later screens without production hooks.
  await page.evaluate(()=>sessionStorage.setItem('public-check-phase','STAGE2'));
  await page.reload();await page.locator('[data-action=resume]').click();await page.locator('[data-letter="ㄱ"]').click();await page.locator('[data-organ="ㄱ"]').click();await page.locator('.journey-discovery').waitFor();
  const animation=await page.locator('.journey-discovery path').last().evaluate(el=>getComputedStyle(el).animationName);if(animation!=='none')throw Error('Reduced motion ignored');
  await page.evaluate(()=>sessionStorage.setItem('public-check-phase','RESULT'));
  await page.reload();await page.locator('[data-action=resume]').click();await page.locator('[data-action=journal]').click();if(!(await page.locator('.journey-journal').innerText()).includes('5 / 5'))throw Error('Journal progress unavailable');await page.locator('.journey-review summary').click();if(!(await page.locator('.journey-review').innerText()).includes('며칠'))throw Error('Review missing');
  if(await page.locator('.journey-review a').getAttribute('href')!=='https://www.korean.go.kr/kornorms/m/m_regltn.do')throw Error('Review source missing');
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,hooks:!!window.__THREE_GAME_TEST_HOOKS__}));if(state.overflow||state.hooks||errors.length)throw Error(JSON.stringify({state,errors}));
  await page.screenshot({path:`artifacts/qa/public-learning-${width}.png`});results.push({width,status:response.status(),guide:true,discovery:true,reducedMotion:true,journal:true,review:true,...state,errors});await context.close();
 }
 console.log(JSON.stringify(results));
}finally{await browser.close();}
