import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:5188');await page.waitForTimeout(1500);
fs.mkdirSync('artifacts/first-pass',{recursive:true});await page.screenshot({path:'artifacts/first-pass/title.png'});
await page.getByRole('button',{name:/시간 여행 시작/}).click();await page.locator('#nickname').fill('한글사랑');await page.getByRole('button',{name:/시간 여행 시작/}).click();await page.getByRole('button',{name:/책을 펼쳐/}).click();await page.waitForTimeout(1500);await page.screenshot({path:'artifacts/first-pass/active.png'});
console.log(JSON.stringify({errors,diagnostics:await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__)},null,2));await browser.close();

