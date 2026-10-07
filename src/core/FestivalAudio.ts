export class FestivalAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private beat = 0;
  private next = 0;
  enabled = true;
  volume = 0.35;
  async unlock() {
    this.ctx ??= new AudioContext();
    if (!this.master) { this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); }
    await this.ctx.resume(); this.sync();
  }
  sync() { if(this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.02); }
  pause(paused: boolean) { if(this.ctx) { if(paused) void this.ctx.suspend(); else void this.ctx.resume(); } }
  private tone(freq: number, delay: number, duration: number, gain: number, type: OscillatorType = 'sine') {
    if(!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    envelope.gain.setValueAtTime(0,t); envelope.gain.linearRampToValueAtTime(gain,t+0.012); envelope.gain.exponentialRampToValueAtTime(0.001,t+duration);
    osc.connect(envelope).connect(this.master); osc.start(t); osc.stop(t+duration+0.02); osc.onended = () => {osc.disconnect(); envelope.disconnect();};
  }
  play(event: 'click'|'pickup'|'correct'|'wrong'|'combo'|'door'|'page'|'portal'|'tick'|'result'|'certificate') {
    const notes: Record<typeof event, number[]> = {click:[660],pickup:[523,784,1047],correct:[659,880],wrong:[220,196],combo:[523,659,784,1047],door:[196,294,392],page:[330,440],portal:[196,294,440,659,988],tick:[880],result:[523,659,784,1047,1319],certificate:[784,1047,1568]};
    notes[event].forEach((n,i)=>this.tone(n,i*.095,event==='wrong'?.15:.42,event==='tick'?.06:.16,event==='wrong'?'triangle':'sine'));
  }
  update(t: number, active: boolean) {
    if(!active || !this.enabled || t < this.next) return;
    this.next=t+1.4;
    const scale=[261.63,329.63,392,440,392,329.63,293.66,392];
    this.tone(scale[this.beat++%scale.length],0,1.3,.035,'triangle');
  }
}
