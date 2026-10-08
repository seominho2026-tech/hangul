import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5188');
const rendered=await page.evaluate(async()=>{
 const {FestivalAudio}=await import('/src/core/FestivalAudio.ts');
 const rates={STAGE1:132,STAGE2:124,BONUS_QUIZ:148};const reports=[];let preview=[];
 for(const [phase,bpm] of Object.entries(rates)){
  const seconds=60/bpm*32+0.3,ctx=new OfflineAudioContext(1,Math.ceil(seconds*22050),22050);
  const a=new FestivalAudio();a.ctx=ctx;a.master=ctx.createGain();a.master.gain.value=0.35;a.master.connect(ctx.destination);
  a.music=ctx.createGain();a.music.gain.value=0.52;a.music.connect(a.master);
  for(let i=0;i<128;i++)a.scheduleStep(i*60/bpm/4,i,phase,false);
  const buffer=await ctx.startRendering();const data=buffer.getChannelData(0);
  let peak=0,energy=0;for(const v of data){peak=Math.max(peak,Math.abs(v));energy+=v*v;}
  reports.push({phase,bpm,seconds,peak,rms:Math.sqrt(energy/data.length)});
  if(phase==='STAGE1')preview=Array.from(data);
 }
 return {reports,preview};
});
for(const r of rendered.reports)if(r.peak>=0.98||r.rms<0.001)throw Error('Clipped or silent music: '+JSON.stringify(r));
// Save a listenable render of the exact runtime composition, without recording a user's microphone.
const data=rendered.preview, wav=Buffer.alloc(44+data.length*2);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);
wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length*2,40);
data.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));
writeFileSync('artifacts/qa/music-preview.wav',wav);
await page.locator('[data-action=start]').click();
const controls=await page.evaluate(async()=>{
 const {FestivalAudio}=await import('/src/core/FestivalAudio.ts');const a=new FestivalAudio();await a.unlock();
 const calls=[];a.scheduleStep=(...args)=>calls.push(args);
 a.update(0,true,'STAGE1',60);if(!calls.length)throw Error('No music scheduled');
 a.enabled=false;const before=calls.length;a.update(0,true,'STAGE1',60);if(calls.length!==before)throw Error('Mute scheduled music');
 a.enabled=true;a.next=a.ctx.currentTime-10;a.update(0,true,'BONUS_QUIZ',8);
 if(calls.length-before>1||!calls.at(-1)[3])throw Error('Catch-up burst or missing urgency');
 await a.pause(true);await a.unlock();
 if(a.ctx.state!=='suspended')throw Error('Pointer unlock defeats pause');
 await a.pause(false);if(a.ctx.state!=='running')throw Error('Resume failed');
 clearInterval(a.timer);await a.ctx.close();return {mute:true,pause:true,resume:true,urgency:true,noCatchUpBurst:true};
});
console.log(JSON.stringify({renders:rendered.reports,controls,preview:'artifacts/qa/music-preview.wav'}));
await browser.close();
