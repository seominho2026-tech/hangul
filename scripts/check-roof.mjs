import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:1100,height:750}});await page.goto('http://127.0.0.1:5188');
await page.evaluate(async()=>{document.querySelector('#app').style.display='none';const c=document.createElement('canvas');c.style.cssText='width:1100px;height:750px;display:block';document.body.append(c);const {PalaceWorld}=await import('/src/world/PalaceWorld.ts');const w=new PalaceWorld(c);window.roofWorld=w;w.camera.position.set(15,15,3);w.camera.lookAt(0,8,-16);w.render();});await page.screenshot({path:`artifacts/qa/roof-${process.argv[2]||'before'}.png`});console.log(await page.evaluate(()=>window.roofWorld.diagnostics()));await browser.close();

