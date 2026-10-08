export class FestivalAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private beat = 0;
  private next = 0;
  private music?: GainNode;
  private noise?: AudioBuffer;
  private paused = false;
  private lastFoley = new Map<string, number>();
  private footSide = 1;
  private timer?: ReturnType<typeof setInterval>;
  private scene = {active:false, phase:'START', remaining:60};
  enabled = true;
  volume = 0.35;
  async unlock() {
    this.ctx ??= new AudioContext();
    if (!this.master) { this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); }
    if (!this.music) { this.music = this.ctx.createGain(); this.music.gain.value = 0.52; this.music.connect(this.master); }
    if(this.paused) return;
    await this.ctx.resume(); this.sync();
    this.timer ??= setInterval(()=>this.pump(),25);
  }
  sync() { if(this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? this.volume * 1.5 : 0, this.ctx.currentTime, 0.02); }
  async pause(paused: boolean) { this.paused=paused; if(this.ctx) { if(paused) await this.ctx.suspend(); else await this.ctx.resume(); } }
  private tone(freq: number, delay: number, duration: number, gain: number, type: OscillatorType = 'sine') {
    if(!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    envelope.gain.setValueAtTime(0,t); envelope.gain.linearRampToValueAtTime(gain,t+0.012); envelope.gain.exponentialRampToValueAtTime(0.001,t+duration);
    osc.connect(envelope).connect(this.master); osc.start(t); osc.stop(t+duration+0.02); osc.onended = () => {osc.disconnect(); envelope.disconnect();};
  }
  play(event: 'click'|'pickup'|'correct'|'wrong'|'combo'|'door'|'page'|'footstep'|'portal'|'tick'|'result'|'certificate') {
    if(event==='page'||event==='door'||event==='footstep') { this.foley(event); return; }
    const notes: Record<typeof event, number[]> = {click:[660],pickup:[523,784,1047],correct:[659,880],wrong:[220,196],combo:[523,659,784,1047],portal:[196,294,440,659,988],tick:[880],result:[523,659,784,1047,1319],certificate:[784,1047,1568]};
    notes[event].forEach((n,i)=>this.tone(n,i*.095,event==='wrong'?.15:.42,event==='tick'?.06:.16,event==='wrong'?'triangle':'sine'));
    if(this.music && this.ctx && ['pickup','correct','wrong','combo','result','portal'].includes(event)) {
      const t=this.ctx.currentTime;
      this.music.gain.cancelScheduledValues(t);
      this.music.gain.setTargetAtTime(0.24,t,0.02);
      this.music.gain.setTargetAtTime(0.52,t+0.45,0.12);
    }
  }
  // Procedural paper, wooden hinge and stone footsteps; these are synthesized,
  // not recordings. A single cached noise buffer serves all short effects.
  private noiseBuffer() {
    if (!this.ctx) return;
    if (!this.noise) {
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0); let seed = 314159;
      for (let i=0;i<data.length;i++) { seed=(seed*1664525+1013904223)>>>0; data[i]=seed/4294967296*2-1; }
    }
    return this.noise;
  }
  private rustle(at: number, duration: number, gain: number, frequency: number, pan: number) {
    if (!this.ctx || !this.master) return;
    const source=this.ctx.createBufferSource(), filter=this.ctx.createBiquadFilter();
    const env=this.ctx.createGain(), stereo=this.ctx.createStereoPanner();
    source.buffer=this.noiseBuffer()!; filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=0.65;
    stereo.pan.value=pan;env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+0.014);
    env.gain.exponentialRampToValueAtTime(0.0001,at+duration);
    source.connect(filter).connect(env).connect(stereo).connect(this.master);
    source.start(at,0.17);source.stop(at+duration+0.01);
    source.onended=()=>{source.disconnect();filter.disconnect();env.disconnect();stereo.disconnect();};
  }
  private foley(event: 'page'|'door'|'footstep') {
    if (!this.ctx || !this.master || this.ctx.state!=='running' || this.paused || !this.enabled) return;
    const now=this.ctx.currentTime, cooldown=event==='footstep'?0.28:event==='page'?0.18:0.6;
    if (now-(this.lastFoley.get(event)??-10)<cooldown) return;
    this.lastFoley.set(event,now);
    if (event==='page') {
      this.rustle(now,0.17,0.19,2400,-0.18);
      this.rustle(now+0.07,0.19,0.11,3800,0.18);
    } else if (event==='footstep') {
      this.footSide*=-1;
      this.rustle(now,0.095,0.12,620,this.footSide*0.13);
      this.tone(this.footSide===1?105:118,0,0.075,0.08,'sine');
    } else {
      this.rustle(now,0.28,0.13,440,-0.2);
      const hinge=this.ctx.createOscillator(), env=this.ctx.createGain();hinge.type='triangle';
      hinge.frequency.setValueAtTime(145,now);hinge.frequency.exponentialRampToValueAtTime(96,now+0.28);
      env.gain.setValueAtTime(0,now);env.gain.linearRampToValueAtTime(0.055,now+0.04);env.gain.exponentialRampToValueAtTime(0.0001,now+0.31);
      hinge.connect(env).connect(this.master);hinge.start(now);hinge.stop(now+0.32);
      hinge.onended=()=>{hinge.disconnect();env.disconnect();};
      this.rustle(now+0.22,0.10,0.17,260,0.12);
    }
  }
  // Short pentatonic plucks, bass and percussion. No external assets or credentials.
  private note(midi:number, at:number, duration:number, gain:number, type:OscillatorType='triangle') {
    if(!this.ctx || !this.music) return;
    const osc=this.ctx.createOscillator(), env=this.ctx.createGain();
    osc.type=type; osc.frequency.value=440*2**((midi-69)/12);
    env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+0.006);
    env.gain.exponentialRampToValueAtTime(0.0001,at+duration);
    osc.connect(env).connect(this.music);osc.start(at);osc.stop(at+duration+0.01);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  }
  private drum(at:number, kind:'kick'|'snare'|'hat', gain:number) {
    if(!this.ctx || !this.music) return;
    const env=this.ctx.createGain();env.connect(this.music);
    const length=kind==='kick'?0.15:kind==='snare'?0.10:0.035;
    env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+0.003);
    env.gain.exponentialRampToValueAtTime(0.0001,at+length);
    if(kind==='kick') {
      const osc=this.ctx.createOscillator();osc.frequency.setValueAtTime(125,at);
      osc.frequency.exponentialRampToValueAtTime(48,at+0.11);
      osc.connect(env);osc.start(at);osc.stop(at+length+0.01);
      osc.onended=()=>{osc.disconnect();env.disconnect();};
    } else {
      const src=this.ctx.createBufferSource(), filter=this.ctx.createBiquadFilter();src.buffer=this.noiseBuffer()!;
      filter.type='highpass';filter.frequency.value=kind==='hat'?6500:1500;
      src.connect(filter).connect(env);src.start(at);src.stop(at+length+0.01);
      src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect();};
    }
  }
  private scheduleStep(at:number, index:number, phase:string, urgent:boolean) {
    const step=index%16, bar=Math.floor(index/16)%8;
    const menu=['START','ATTRACT','PLAYER_SETUP','INTRO'].includes(phase);
    const quiz=phase==='BONUS_QUIZ';
    const intensity=menu?0.55:quiz?1:phase==='STAGE1'?0.85:0.65;
    const roots=[38,36,43,38,38,36,43,45];
    // Eight bars: two related phrases, a lift and a turn back to the opening.
    const melody=[
      [74,0,77,0,81,0,79,77,0,74,0,72,74,0,0,0],
      [72,0,74,77,0,79,0,77,0,74,0,72,0,0,74,0],
      [79,0,81,0,84,0,81,79,0,77,0,74,77,0,0,0],
      [77,0,74,0,72,0,74,0,0,0,77,79,81,0,0,0],
      [74,0,77,79,81,0,84,0,81,0,79,77,74,0,0,0],
      [72,0,74,0,77,79,0,77,0,74,0,72,74,0,77,0],
      [79,0,81,0,84,0,86,84,81,0,79,0,77,0,74,0],
      [81,0,79,77,74,0,72,0,74,0,0,0,0,0,72,0],
    ];
    const pitch=melody[bar][step];
    if(pitch){this.note(pitch,at,0.17,0.075*intensity);this.note(pitch+12,at,0.07,0.018*intensity,'sine');}
    if(step===0||step===8||(!menu&&(step===6||step===14)))this.note(roots[bar]+(step===14?12:0),at,0.16,0.095*intensity,'sine');
    if(step===0||step===8||quiz&&step===10)this.drum(at,'kick',0.15*intensity);
    if(!menu&&(step===4||step===12)){this.drum(at,'snare',0.065*intensity);this.note(50,at,0.07,0.035*intensity,'sine');}
    if(!menu&&step%2===0)this.drum(at,'hat',0.033*intensity);
    if(quiz&&(step===3||step===11))this.note(roots[bar]+24,at,0.09,0.04,'triangle');
    if(urgent&&step%4===0)this.note(86,at,0.045,0.023,'sine');
  }
  update(_t:number, active:boolean, phase='STAGE1', remaining=60) {
    this.scene={active,phase,remaining};this.pump();
  }
  private pump() {
    const {active,phase,remaining}=this.scene;
    if(!this.ctx || !this.music || this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;
    if(!active || this.paused || !this.enabled || ['RESULT','CERTIFICATE','RANKING','RESTORE'].includes(phase)) {this.next=now;return;}
    // Schedule against the audio clock, independent of frame rate. Do not catch
    // up missed beats when returning from a muted or suspended tab.
    if(this.next<now)this.next=now+0.015;
    const urgent=phase==='BONUS_QUIZ'&&remaining<=10;
    const bpm=phase==='BONUS_QUIZ'?(urgent?160:148):phase==='STAGE1'?132:124;
    while(this.next<now+0.065){this.scheduleStep(this.next,this.beat++,phase,urgent);this.next+=60/bpm/4;}
  }
}
