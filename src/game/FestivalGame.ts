import { gameConfig as config } from '../config/gameConfig';
import { PalaceWorld, PICKUPS } from '../world/PalaceWorld';
import { FestivalAudio } from '../core/FestivalAudio';
import { freshRun, loadRun, total, titleFor, normalizeNickname, validNickname, RUN_KEY, SETTINGS_KEY, type Phase, type RunState } from '../core/RunState';
import { sources } from '../data/educationContent';
import { questions } from '../data/questions';
import { LocalRankingService } from '../ranking/RankingService';
import { createCertificate } from '../certificate/CertificateGenerator';
import { createSeededRandom } from '../utils/random';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const glyphs=['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'];
const organs=[{char:'ㄱ',name:'혀뿌리 · 목구멍',hint:'혀뿌리가 목구멍을 막는 모양',path:'M35 75 Q25 45 60 22 Q84 15 91 44 L86 85 M37 66 L65 66 L65 40'}, {char:'ㄴ',name:'혀끝 · 윗잇몸',hint:'혀끝이 윗잇몸에 닿는 모양',path:'M30 30 Q65 8 86 38 L86 85 M34 77 L66 77 Q76 73 76 45'}, {char:'ㅁ',name:'입',hint:'입의 모양',path:'M25 34 Q60 15 95 34 L95 76 Q60 97 25 76 Z M30 55 L90 55'}, {char:'ㅅ',name:'이',hint:'이의 모양',path:'M20 35 L100 35 L92 80 L72 65 L60 82 L48 65 L28 80 Z'}, {char:'ㅇ',name:'목구멍',hint:'목구멍의 모양',path:'M60 22 A33 33 0 1 1 59.9 22 M60 36 A19 19 0 1 0 60.1 36'}];
const strokes=[{from:'ㄱ',to:'ㅋ',y:52},{from:'ㄴ',to:'ㄷ',y:25},{from:'ㄷ',to:'ㅌ',y:52},{from:'ㅁ',to:'ㅂ',y:52},{from:'ㅂ',to:'ㅍ',y:82},{from:'ㅅ',to:'ㅈ',y:25},{from:'ㅈ',to:'ㅊ',y:14}];
// The SVG and drop zones share a 100 x 100 coordinate system, independent of fonts.
const strokeBases=[
  'M20 25 H80 V82',
  'M20 25 V82 H80',
  'M80 25 H20 V82 H80',
  'M20 25 V82 H80 V25',
  'M20 25 H80 M30 25 V82 M70 25 V82',
  'M50 40 L20 82 M50 40 L80 82',
  'M20 25 H80 M50 40 L20 82 M50 40 L80 82',
];
const strokeDrawing=(index:number)=>`<svg class="stroke-diagram" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="${strokes[index].to} 만들기 밑그림"><path d="${strokeBases[index]}"/></svg>`;
const stages=['집현전을 찾아라','자음의 비밀','천·지·인','가획의 방','한글 조립소'];
export class FestivalGame {
  private world:PalaceWorld;
  private audio=new FestivalAudio();
  private ranking=new LocalRankingService();
  private run:RunState=freshRun();
  private resume:RunState|null=loadRun();
  private ui:HTMLElement;
  private toastEl:HTMLElement;
  private keys=new Set<string>();
  private stick={x:0,z:0};
  private selected='';
  private last=performance.now();
  private time=0; private frame=0; private idle=0; private saveClock=0; private readyUntil=0;
  private paused=false; private frozen=false;
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private modal=false; private quizLocked=false; private quizFeedbackUntil=0; private quizFeedback='';
  private rng=createSeededRandom(Date.now());
  private storageWarning=false;
  private settings={festivalMode:config.festivalMode,soundEnabled:config.soundEnabled,volume:config.volume};
  private certificateToken=0; private testClockOffset=0;
  constructor(private root:HTMLElement){
    try { const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); if(typeof s.festivalMode==='boolean')this.settings.festivalMode=s.festivalMode;if(typeof s.soundEnabled==='boolean')this.settings.soundEnabled=s.soundEnabled;if(typeof s.volume==='number')this.settings.volume=Math.max(0,Math.min(1,s.volume)); }catch{}
    root.innerHTML='<canvas id="world" aria-label="조선 궁궐 3D 탐험 공간"></canvas><div class="vignette"></div><div id="ui"></div><div id="toast" role="status" aria-live="polite"></div><div id="modal-root"></div>';
    this.ui=root.querySelector('#ui')!;this.toastEl=root.querySelector('#toast')!;
    this.world=new PalaceWorld(root.querySelector('canvas')!);
    this.audio.enabled=this.settings.soundEnabled;this.audio.volume=this.settings.volume;
    this.bind();this.render();this.installHooks();requestAnimationFrame(this.tick);
    if(new URLSearchParams(location.search).get('admin')==='true')this.showAdmin();
  }
  private now(){return Date.now()+this.testClockOffset;}
  private persist(){
    if(['START','ATTRACT','PLAYER_SETUP'].includes(this.run.phase)||!this.run.nickname)return;
    this.run.position=this.world.getPlayer();
    try{localStorage.setItem(RUN_KEY,JSON.stringify(this.run));}catch{if(!this.storageWarning){this.storageWarning=true;this.toast('이 브라우저에서는 기록 저장이 제한됩니다.');}}
  }
  private change(phase:Phase){this.run.phase=phase;this.selected='';this.keys.clear();this.stick={x:0,z:0};this.idle=0;this.world.setMode(phase);this.render();this.persist();}
  private start(){this.run=freshRun();this.world.setCollected([]);this.world.setPlayer(0,15);this.change('PLAYER_SETUP');}
  private home(){if(!this.run.nickname&&this.resume){this.run=freshRun();this.change('START');return;}this.run=freshRun();this.resume=null;this.paused=false;this.quizLocked=false;this.world.setCollected([]);this.world.setPlayer(0,15);try{localStorage.removeItem(RUN_KEY);}catch{}this.change('START');}
  private toast(text:string){this.toastEl.textContent=text;this.toastEl.classList.remove('show');requestAnimationFrame(()=>this.toastEl.classList.add('show'));}
  private button(action:string,text:string,cls=''){return `<button class="${cls}" data-action="${action}">${text}</button>`;}
  private shell(content:string,cls=''){return `<div class="screen ${cls}">${content}</div>`;}
  private chrome(){return `<header class="topbar"><a class="brand" href="#" data-action="brand"><span class="brand-seal">훈</span><span>훈민정음 <small>사라진 글자를 찾아라</small></span></a><div class="top-actions">${this.button('sound',this.audio.enabled?'♪ 소리 켜짐':'♪ 소리 꺼짐','quiet sound-button')}${this.button('help','?','icon-button')}${!['START','ATTRACT','PLAYER_SETUP','RESULT','CERTIFICATE','RANKING'].includes(this.run.phase)?this.button('pause','Ⅱ','icon-button'):''}</div></header>`;}
  private render(){
    const p=this.run.phase;let body='';
    if(p==='START'||p==='ATTRACT'){
      body=this.shell(`<div class="title-copy"><div class="eyebrow"><span class="red-dot"></span> 한글날 SCHOOL FESTIVAL EDITION</div><div class="title-date">一 四 四 六</div><h1>훈민정음<span>사라진 글자를 찾아라</span></h1><p class="title-sub">사라진 스물여덟 글자의 비밀</p><div class="title-rule"></div><p class="title-desc">${p==='ATTRACT'?'도전자를 찾습니다!<br>사라진 글자를 찾을 다음 주인공은 당신입니다.':'시간의 문 너머, 글자가 사라진 조선.<br>다섯 가지 비밀을 풀고 한글을 되찾아 주세요.'}</p><div class="title-buttons">${this.button('start','시간 여행 시작 <span>→</span>','primary large')}${this.resume?this.button('resume',`${esc(this.resume.nickname)} 님의 탐험 이어하기`,'resume'):''}${this.button('ranking','오늘의 한글 지킴이 ↗','text-button')}</div><div class="journey-meta"><span>본편 8–12분</span><i></i><span>5개의 비밀</span><i></i><span>인증서 발급</span></div></div><div class="world-caption"><span>1446 · 조선</span><b>집현전의 문이 열립니다</b></div><footer class="title-footer"><span>누구나 자신의 생각을 글로 표현할 수 있도록.</span><span>WASD 이동 · E 상호작용 · 모바일 터치 지원</span></footer>`,'title-screen');
    }else if(p==='PLAYER_SETUP'){
      body=this.shell(`<section class="panel setup"><span class="eyebrow">새로운 한글 지킴이</span><h1>어떤 이름으로<br>기억될까요?</h1><p>실명 대신 닉네임을 사용해 주세요.<br>기록은 이 기기의 브라우저에만 저장됩니다.</p><form id="nickname-form"><label for="nickname">도전자 이름 <small>최대 10자</small></label><input id="nickname" name="nickname" maxlength="10" placeholder="예: 한글사랑" autocomplete="off" required/><p id="name-error" class="error" role="alert"></p><button class="primary large" type="submit">시간 여행 시작 →</button></form>${this.button('home','처음으로','text-button')}</section>`,'center-screen');
    }else if(p==='INTRO'){
      body=this.shell(`<section class="panel story"><span class="eyebrow">PROLOGUE · 시간의 문</span><div class="book" aria-label="훈민정음 책"><span>訓<br>民<br>正<br>音</span></div><h1>도서관에서 발견한<br>오래된 한 권의 책</h1><p>책 속의 글자들이 흩어지며 시간의 문이 열립니다.<br><strong>1446년, 훈민정음이 세상에 모습을 드러내던 해.</strong></p><p>사라진 글자를 찾아 훈민정음을 복원해 주세요.</p>${this.button('enter-palace','책을 펼쳐 1446년으로 →','primary large')}</section>`,'center-screen');
    }else if(p==='STAGE1'){
      const count=this.run.collected.length;
      body=`${this.hud(0)}<div class="explore-objective"><span class="eyebrow">첫 번째 임무</span><h2>${count===5?'집현전의 문이 열렸습니다':'빛나는 글자 조각을 찾아라'}</h2><p>${count===5?'다섯 글자에 숨은 원리를 알아보세요.':'궁궐을 탐험하고 글자 가까이에서 E를 누르세요.'}</p><div class="inventory">${glyphs.map(c=>`<span class="${this.run.collected.includes(c)?'found':''}">${c}</span>`).join('')}<b>${count} / 5</b></div>${count===5?this.button('next-stage','집현전으로 들어가기 →','primary'):''}</div><div class="minimap" aria-label="글자 위치 지도"><span>궁궐 지도</span>${PICKUPS.map(a=>`<i class="map-letter ${this.run.collected.includes(a.char)?'taken':''}" style="left:${50+a.x*2}%;top:${50+a.z*1.8}%">${a.char}</i>`).join('')}<b id="map-player">◆</b><em>남문</em></div><div class="explore-bottom"><div class="key-guide"><kbd>W A S D</kbd> 이동 <kbd>E</kbd> 발견<br><small>화면을 드래그하면 시점을 돌릴 수 있어요.</small></div><button id="interact" class="interact" data-action="interact"><kbd>E</kbd><span id="near-label">글자를 찾아 가까이 가세요</span></button></div><div class="touch-controls"><div id="joystick" role="group" aria-label="이동 조이스틱"><span id="stick-knob"></span></div><button data-action="interact" class="touch-interact" aria-label="글자 발견">발견 <span>✦</span></button></div>`;
    }else if(['STAGE2','STAGE3','STAGE4','STAGE5'].includes(p))body=this.puzzle();
    else if(p==='RESTORE')body=this.shell(`<section class="panel story restore"><span class="eyebrow">FINAL · 훈민정음 복원</span><div class="restored-letters">ㄱ ㄴ ㅁ ㅅ ㅇ ㆍ ㅡ ㅣ</div><div class="book restored"><span>訓<br>民<br>正<br>音</span></div><h1>스물여덟 글자,<br>다시 세상으로.</h1><p class="king-quote">“누구나 자신의 생각을 글로 표현할 수 있는<br>세상을 꿈꾸었습니다.”</p><small>세종의 뜻을 바탕으로 만든 게임 속 대사입니다.</small><p>백성이 쉽게 익혀 편히 쓰도록 만든 훈민정음.<br>처음에는 <strong>28자</strong>, 오늘날 기본 자모는 <strong>24자</strong>입니다.<br>지금 쓰지 않는 <strong>ㆍ, ㆁ, ㅿ, ㆆ</strong>도 있었어요.</p><div class="reward">복원 완료 +1,000</div>${this.button('bonus','이제, 60초 한글 도전 →','primary large')}</section>`,'center-screen');
    else if(p==='BONUS_READY')body=this.shell(`<section class="panel story"><span class="eyebrow">BONUS CHALLENGE</span><h1>60초 한글 도전</h1><p>정답 +100 · 오답 감점 없음<br>5연속 +100 · 10연속 +300<br>10연속마다 보너스가 반복됩니다.</p><div id="countdown" class="countdown">${this.readyUntil?Math.max(1,Math.ceil((this.readyUntil-this.now())/1000)):'60'}</div><p>맞춤법부터 훈민정음까지, 배운 것을 펼쳐 보세요.</p>${this.readyUntil?'':this.button('quiz-countdown','준비됐어요!','primary large')}</section>`,'center-screen');
    else if(p==='BONUS_QUIZ')body=this.quizScreen();
    else if(p==='RESULT')body=this.resultScreen();
    else if(p==='CERTIFICATE')body=this.shell(`<section class="panel certificate-panel"><span class="eyebrow">당신의 도전을 기억합니다</span><h1>한글 지킴이 인증서</h1><div id="certificate-preview"><p>인증서를 그리고 있습니다…</p></div><div class="button-row">${this.button('download','PNG 이미지 저장 ↓','primary')}${this.button('ranking','오늘의 순위 →')}</div><p class="subtle">다음 참가자와 기기를 공유한다면 이미지를 먼저 저장해 주세요.</p>${this.resetNote()}</section>`,'center-screen');
    else if(p==='RANKING')body=this.rankingScreen();
    this.ui.innerHTML=this.chrome()+body;
    if(p==='PLAYER_SETUP')requestAnimationFrame(()=>this.ui.querySelector<HTMLInputElement>('input')?.focus());
    if(p==='STAGE1')this.bindJoystick();if(p==='CERTIFICATE')void this.drawCertificate();if(p==='STAGE4')this.bindStroke();
  }
  private hud(stage:number){return `<div class="hud"><div class="stage-track">${stages.map((s,i)=>`<span class="${i===stage?'active':i<stage?'done':''}" title="${s}">${i<stage?'✓':i+1}</span>`).join('')}<b>${stages[stage]}</b></div><div class="score-hud"><small>SCORE</small><strong id="score">${total(this.run.scores).toLocaleString()}</strong></div></div>`;}
  private puzzle(){
    const p=this.run.phase,stage=Number(p.slice(-1))-1; let game='',heading='',desc='',complete=false;
    if(p==='STAGE2'){
      heading='소리가 만들어지는 모양';desc='글자를 고른 뒤, 닮은 발음 기관을 찾아 연결하세요.';
      complete=organs.every(o=>this.run.solved.includes('organ-'+o.char));
      game=`<div class="letter-rack">${glyphs.map(c=>`<button class="glyph ${this.selected===c?'selected':''}" data-letter="${c}" ${this.run.solved.includes('organ-'+c)?'disabled':''}>${c}</button>`).join('')}</div><div class="organ-grid">${[organs[2],organs[4],organs[0],organs[3],organs[1]].map(o=>`<button class="organ ${this.run.solved.includes('organ-'+o.char)?'solved':''}" data-organ="${o.char}" ${this.run.solved.includes('organ-'+o.char)?'disabled':''}><svg viewBox="0 0 120 110" aria-hidden="true"><path d="${o.path}"/></svg><span>${o.name}</span><b>${this.run.solved.includes('organ-'+o.char)?o.char+' ✓':'연결하기'}</b></button>`).join('')}</div><p class="subtle">발음 기관을 단순화한 상징 그림입니다.</p>`;
    }else if(p==='STAGE3'){
      heading='하늘과 땅, 그리고 사람';desc='기본 모음 세 글자를 천·지·인과 연결하세요.';
      complete=['ㆍ','ㅡ','ㅣ'].every(c=>this.run.solved.includes('vowel-'+c));
      game=`<div class="letter-rack">${['ㅣ','ㆍ','ㅡ'].map(c=>`<button class="glyph ${this.selected===c?'selected':''}" data-letter="${c}" ${this.run.solved.includes('vowel-'+c)?'disabled':''}>${c}</button>`).join('')}</div><div class="vowel-grid">${[{c:'ㆍ',n:'하늘',symbol:'◯',d:'둥근 하늘'},{c:'ㅡ',n:'땅',symbol:'━',d:'평평한 땅'},{c:'ㅣ',n:'사람',symbol:'人',d:'서 있는 사람'}].map(v=>`<button class="vowel ${this.run.solved.includes('vowel-'+v.c)?'solved':''}" data-vowel="${v.c}" ${this.run.solved.includes('vowel-'+v.c)?'disabled':''}><span class="cosmic">${v.symbol}</span><strong>${v.n}</strong><small>${v.d}</small><b>${this.run.solved.includes('vowel-'+v.c)?v.c+' ✓':'연결하기'}</b></button>`).join('')}</div>${complete?'<div class="vowel-creation"><span>ㆍ + ㅣ → ㅏ · ㅓ</span><span>ㆍ + ㅡ → ㅗ · ㅜ</span></div>':''}`;
    }else if(p==='STAGE4'){
      heading='획 하나가 여는 새 소리';desc='금빛 획을 글자 안의 올바른 점선 위치로 옮기세요.';
      const idx=strokes.findIndex((_,i)=>!this.run.solved.includes('stroke-'+i));complete=idx===-1;const st=strokes[Math.max(0,idx)];
      game=complete?'<div class="success-glyph">ㄱ → ㅋ<br>ㄴ → ㄷ → ㅌ<br>ㅁ → ㅂ → ㅍ<br>ㅅ → ㅈ → ㅊ</div>':`<div class="stroke-meta">${idx+1} / ${strokes.length}<span>${st.from} → <strong>${st.to}</strong></span></div><div class="stroke-workbench"><div class="stroke-piece" id="stroke-piece" tabindex="0" role="button" aria-label="가로획 선택">━<small>획 조각</small></div><div class="stroke-board">${strokeDrawing(idx)}${[14,25,52,82].map(y=>`<button class="stroke-target" style="top:${y}%" data-stroke-y="${y}" aria-label="${y===14?'맨 위':y===25?'위':y===52?'가운데':'아래'}에 획 놓기"></button>`).join('')}</div><div class="target-letter"><small>만들 글자</small>${st.to}</div></div><p class="subtle">터치·키보드: 획 조각을 선택한 뒤 점선을 누르세요.<br>${idx===3||idx===4?'이 문제는 기존 획의 길이와 배치를 조정한 조립용 밑그림입니다. 점선에 획을 놓아 목표 글자를 완성하세요.':'점선의 가운데에 금빛 획이 놓입니다.'}</p>`;
    }else{
      heading='글자가 만나 하나의 소리로';desc='초성 → 중성 → 종성 순서로 조각을 눌러 글자를 완성하세요.';
      const han=this.run.solved.includes('word-한'),word=han?'글':'한',parts=han?['ㄱ','ㅡ','ㄹ']:['ㅎ','ㅏ','ㄴ'];
      complete=han&&this.run.solved.includes('word-글');const filled=parts.filter((_,i)=>this.run.solved.includes('syllable-'+word+'-'+i)).length;
      game=complete?'<div class="assembled-word">한글</div><p class="completion-copy">소리를 모아 적는 우리 글, 한글을 완성했습니다.</p>':`<div class="syllable-target"><small>이번에 만들 글자</small><strong>${word}</strong></div><div class="syllable-slots">${['초성','중성','종성'].map((n,i)=>`<div class="slot ${i<filled?'filled':''}" data-slot="${i}"><small>${n}</small><strong>${i<filled?parts[i]:'?'}</strong></div>`).join('')}</div><div class="letter-rack">${(han?['ㄹ','ㅏ','ㄱ','ㅡ','ㅎ']:['ㄴ','ㅡ','ㅎ','ㅏ','ㄱ']).map(c=>`<button class="glyph" data-jamo="${c}">${c}</button>`).join('')}</div><p class="subtle">${han?'한 ✓　+　글 …':'첫 번째 글자를 조립하고, 다음 글자에 도전하세요.'}</p>`;
    }
    return `${this.hud(stage)}${this.shell(`<section class="puzzle-panel"><div class="puzzle-heading"><span class="eyebrow">STAGE ${stage+1} · ${stages[stage]}</span><h1>${heading}</h1><p>${desc}</p></div>${game}<p id="puzzle-feedback" role="status" aria-live="polite">${complete?'✓ 원리를 발견했습니다! 다음 문이 열렸어요.':'천천히 살펴보세요. 틀려도 점수는 줄지 않아요.'}</p>${complete?this.button('next-stage',p==='STAGE5'?'훈민정음 복원하기 →':'다음 비밀로 →','primary large'):''}</section>`,'puzzle-screen')}`;
  }
  private quizScreen(){
    const q=questions[this.run.quizOrder[this.run.quizIndex%this.run.quizOrder.length]];if(!q)return '';
    return this.shell(`<section class="quiz-panel"><div class="quiz-stats"><div><small>남은 시간</small><strong id="quiz-time">${Math.ceil((this.run.quizDeadline-this.now())/1000)}</strong></div><div class="quiz-combo"><small>연속 정답</small><strong>${this.run.combo} <em>COMBO</em></strong></div><div><small>SCORE</small><strong>${total(this.run.scores).toLocaleString()}</strong></div></div><div class="timer-track"><span id="timer-fill"></span></div><span class="eyebrow">${esc(q.category)} · ${this.run.quizIndex+1}번째 도전</span><h1>${esc(q.question)}</h1><div class="quiz-choices">${q.choices.map((c,i)=>`<button data-answer="${i}" ${this.quizLocked?'disabled':''} class="${this.quizLocked&&i===q.answer?'correct':''}"><span>${i+1}</span>${esc(c)}</button>`).join('')}</div><div class="quiz-feedback" role="status">${this.quizLocked?esc(this.quizFeedback):'정답 +100 · 오답 감점 없음'}</div><small class="subtle">숫자 1–4 키로도 답할 수 있어요. 시간은 계속 흐릅니다.</small></section>`,'center-screen');
  }
  private resetNote(){return this.settings.festivalMode?'<p class="reset-note">다음 도전자를 기다리고 있습니다 · <b id="reset-count">30</b>초 동안 조작이 없으면 처음으로</p>':'';}
  private resultScreen(){
    const s=this.run.scores,t=total(s),rank=this.ranking.list(true).findIndex(e=>e.id===this.run.id)+1;
    return this.shell(`<section class="panel result-panel"><span class="eyebrow">MISSION COMPLETE</span><h1>훈민정음 복원 성공!</h1><p><strong>${esc(this.run.nickname)}</strong> 님, 당신의 발견이 글자를 되살렸습니다.</p><div class="title-award"><span>✦</span> ${titleFor(t)} <span>✦</span></div><div class="total-score"><small>TOTAL SCORE</small><strong>${t.toLocaleString()}</strong></div><div class="score-breakdown">${[['탐험',s.exploration],['원리 퍼즐',s.puzzle],['훈민정음 복원',s.completion],['60초 도전',s.quiz],['콤보 보너스',s.combo],['시간 보너스',s.time]].map(([n,v])=>`<div><span>${n}</span><b>${Number(v).toLocaleString()}</b></div>`).join('')}</div><p>이 기기의 오늘 순위 <strong>${rank?rank+'위':'저장 대기'}</strong> · 최고 ${this.run.bestCombo}연속 정답</p><div class="button-row">${this.button('certificate','한글 지킴이 인증서 →','primary')}${this.button('ranking','오늘의 순위')}</div>${this.button('restart','다시 도전','text-button')}${this.resetNote()}</section>`,'center-screen');
  }
  private rankingScreen(){
    const entries=this.ranking.list(true).slice(0,config.rankingLimit);
    return this.shell(`<section class="panel ranking-panel"><span class="eyebrow">FESTIVAL RANKING</span><h1>오늘의 한글 지킴이</h1><p>이 기기의 오늘 기록 TOP ${config.rankingLimit}<br><small>다른 기기의 점수와 합쳐지지 않아요 · 한국 시간 기준</small></p><ol class="rankings">${entries.length?entries.map((e,i)=>`<li class="${e.id===this.run.id?'mine':''}"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${esc(e.nickname)}</strong><small>${esc(e.title)}</small></div><span>${e.score.toLocaleString()}</span></li>`).join(''):'<li class="empty">첫 번째 한글 지킴이가 되어 보세요!</li>'}</ol><div class="button-row">${this.run.scores.completion>0?this.button('certificate','내 인증서'):''}${this.button('restart','새로운 도전 →','primary')}${this.button('home','처음으로')}</div>${this.resetNote()}</section>`,'center-screen');
  }
  private award(key:string,points:number,group:'puzzle'|'exploration'='puzzle'){
    if(this.run.solved.includes(key))return false;this.run.solved.push(key);this.run.scores[group]+=points;this.audio.play('correct');this.toast(`발견 성공! +${points.toLocaleString()}`);this.persist();return true;
  }
  private feedback(text:string){const el=this.ui.querySelector('#puzzle-feedback');if(el){el.textContent=text;el.classList.add('wrong');}this.audio.play('wrong');}
  private match(kind:'organ'|'vowel',char:string){
    if(!this.selected){this.feedback('먼저 위쪽에서 글자를 하나 골라 주세요.');return;}
    if(this.selected!==char){this.feedback(kind==='organ'?`${organs.find(o=>o.char===char)!.hint}을 떠올려 보세요.`:char==='ㆍ'?'하늘을 닮은 둥근 글자를 찾아보세요.':char==='ㅡ'?'땅처럼 평평한 글자를 찾아보세요.':'서 있는 사람처럼 곧은 글자를 찾아보세요.');return;}
    this.award(kind+'-'+char,200);this.selected='';this.render();
  }
  private placeStroke(y:number){
    if(this.run.phase!=='STAGE4')return;if(this.selected!=='stroke'){this.feedback('먼저 금빛 획 조각을 선택해 주세요.');return;}
    const i=strokes.findIndex((_,idx)=>!this.run.solved.includes('stroke-'+idx));if(i<0)return;
    if(strokes[i].y!==y){this.feedback(`목표 글자 ${strokes[i].to}의 새 획 위치를 살펴보세요.`);return;}
    this.award('stroke-'+i,200);this.selected='';this.render();
  }
  private jamo(char:string){
    if(this.run.phase!=='STAGE5'||this.run.solved.includes('word-글'))return;
    const han=this.run.solved.includes('word-한'),word=han?'글':'한',parts=han?['ㄱ','ㅡ','ㄹ']:['ㅎ','ㅏ','ㄴ'];
    const idx=parts.findIndex((_,i)=>!this.run.solved.includes('syllable-'+word+'-'+i));
    if(parts[idx]!==char){this.feedback(`${['첫소리(초성)','가운뎃소리(중성)','끝소리(종성)'][idx]}를 골라 주세요.`);return;}
    this.run.solved.push('syllable-'+word+'-'+idx);this.audio.play('pickup');if(idx===2)this.award('word-'+word,500);this.render();this.persist();
  }
  private interact(){
    if(this.run.phase!=='STAGE1'||this.paused||this.modal)return;
    const char=this.world.nearest();if(!char||this.run.collected.includes(char)){this.toast('빛나는 글자에 조금 더 가까이 가세요.');return;}
    this.run.collected.push(char);this.run.scores.exploration+=100;this.world.burst(char);this.world.setCollected(this.run.collected);this.audio.play('pickup');this.toast(`${char} 발견! +100`);if(this.run.collected.length===5)this.audio.play('door');this.render();this.persist();
  }
  private advance(){
    const p=this.run.phase;
    if(p==='STAGE1'&&this.run.collected.length===5)this.change('STAGE2');
    else if(p==='STAGE2'&&organs.every(o=>this.run.solved.includes('organ-'+o.char)))this.change('STAGE3');
    else if(p==='STAGE3'&&['ㆍ','ㅡ','ㅣ'].every(c=>this.run.solved.includes('vowel-'+c)))this.change('STAGE4');
    else if(p==='STAGE4'&&strokes.every((_,i)=>this.run.solved.includes('stroke-'+i)))this.change('STAGE5');
    else if(p==='STAGE5'&&this.run.solved.includes('word-글')){this.run.scores.completion=1000;this.run.scores.time=Math.max(0,Math.min(500,Math.floor((720-this.run.elapsed)/12)*10));this.audio.play('result');this.change('RESTORE');}
  }
  private beginQuiz(){
    this.run.quizOrder=questions.map((_,i)=>i);for(let i=this.run.quizOrder.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.run.quizOrder[i],this.run.quizOrder[j]]=[this.run.quizOrder[j],this.run.quizOrder[i]];}
    this.run.quizIndex=0;this.run.quizDeadline=this.now()+config.bonusQuizDuration*1000;this.quizLocked=false;this.readyUntil=0;this.change('BONUS_QUIZ');
  }
  private answer(i:number){
    if(this.run.phase!=='BONUS_QUIZ'||this.quizLocked||this.modal)return;if(this.now()>=this.run.quizDeadline){this.finish();return;}
    const q=questions[this.run.quizOrder[this.run.quizIndex%this.run.quizOrder.length]];
    if(i===q.answer){this.run.scores.quiz+=100;this.run.combo++;this.run.bestCombo=Math.max(this.run.bestCombo,this.run.combo);const bonus=this.run.combo%10===0?300:this.run.combo%10===5?100:0;this.run.scores.combo+=bonus;this.audio.play(bonus?'combo':'correct');this.quizFeedback=`정답! +100${bonus?' · 콤보 +'+bonus:''}　${q.explanation}`;}
    else {this.run.combo=0;this.audio.play('wrong');this.quizFeedback='아쉬워요! '+q.explanation;}
    this.quizLocked=true;this.quizFeedbackUntil=this.now()+1100;this.run.quizIndex++;this.persist();this.run.quizIndex--;this.render();this.run.quizIndex++;
  }
  private finish(){
    this.quizLocked=false;this.run.quizDeadline=0;this.run.phase='RESULT';
    try{this.ranking.save({id:this.run.id,nickname:this.run.nickname,score:total(this.run.scores),title:titleFor(total(this.run.scores)),date:new Date().toISOString()});this.run.saved=true;}catch{this.toast('순위를 저장하지 못했습니다. 인증서는 저장할 수 있어요.');}
    this.audio.play('result');this.change('RESULT');
  }
  private async drawCertificate(){
    const token=++this.certificateToken;
    try{const canvas=await createCertificate(this.run.nickname,total(this.run.scores),titleFor(total(this.run.scores)),config.schoolName,config.schoolLogo);
      if(this.run.phase!=='CERTIFICATE'||token!==this.certificateToken)return;canvas.id='certificate-canvas';canvas.setAttribute('aria-label',`${this.run.nickname} 님의 한글 지킴이 인증서`);this.ui.querySelector('#certificate-preview')!.replaceChildren(canvas);
    }catch{const el=this.ui.querySelector('#certificate-preview');if(el)el.textContent='인증서를 만들지 못했습니다. 결과 화면으로 돌아가 다시 시도해 주세요.';}
  }
  private download(){const c=this.ui.querySelector<HTMLCanvasElement>('#certificate-canvas');if(!c)return;c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`한글지킴이-${this.run.nickname}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');this.audio.play('certificate');}
  private openModal(content:string){this.modal=true;this.keys.clear();this.stick={x:0,z:0};this.root.querySelector('#modal-root')!.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" tabindex="-1">${content}${this.button('close-modal','닫기','primary')}</section></div>`;this.root.querySelector<HTMLElement>('.modal')?.focus();}
  private closeModal(){this.modal=false;this.root.querySelector('#modal-root')!.innerHTML='';this.idle=0;if(this.paused){this.paused=false;this.audio.pause(false);}}
  private showHelp(){this.openModal(`<span class="eyebrow">탐험 안내</span><h2>글자를 찾고, 비밀을 풀어요</h2><ol class="help-list"><li><b>궁궐 탐험</b> WASD·방향키로 이동하고, 가까운 글자에서 E를 누르세요. 화면을 드래그하면 시점이 바뀝니다.</li><li><b>모바일</b> 왼쪽 조이스틱으로 이동하고 오른쪽 ‘발견’을 누르세요.</li><li><b>원리 퍼즐</b> 글자를 고른 뒤 알맞은 그림이나 자리에 놓으세요. 틀려도 다시 할 수 있어요.</li><li><b>60초 도전</b> 보기 버튼 또는 숫자 1–4로 답해요. 퀴즈 중에는 시간이 멈추지 않아요.</li></ol><p>진행 상황과 순위는 이 브라우저에만 저장됩니다.</p><details><summary>교육 자료 출처</summary><p>${sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join("<br>")}</p><p>궁궐과 인물은 역사적 복원이 아닌 학습용 창작 표현입니다.</p></details>`);}
  private showAdmin(){this.openModal(`<span class="eyebrow">교사용 · 이 기기 설정</span><h2>축제 운영 설정</h2><p>간편 메뉴이며, 로그인 보안 기능이 아닙니다.<br>이 브라우저의 기록만 관리합니다.</p><label class="setting-line">음량 <input id="volume" type="range" min="0" max="1" step="0.05" value="${this.settings.volume}"/></label><label class="setting-line">축제 모드 <input id="festival" type="checkbox" ${this.settings.festivalMode?'checked':''}/></label><p>문제 ${questions.length}개 · v${config.version}</p><div class="button-row">${this.button('clear-today','오늘 기록 초기화')}${this.button('clear-all','전체 기록 초기화')}</div><p id="admin-feedback" role="status"></p>`);}
  private bind(){
    this.root.addEventListener('pointerdown',()=>{this.idle=0;void this.audio.unlock().catch(()=>{});});
    this.root.addEventListener('click',e=>{
      const t=e.target as HTMLElement,b=t.closest<HTMLElement>('[data-action]');
      if(b){e.preventDefault();this.action(b.dataset.action!);return;}
      const letter=t.closest<HTMLElement>('[data-letter]');if(letter){this.selected=letter.dataset.letter!;this.audio.play('click');this.render();return;}
      const organ=t.closest<HTMLElement>('[data-organ]');if(organ){this.match('organ',organ.dataset.organ!);return;}
      const vowel=t.closest<HTMLElement>('[data-vowel]');if(vowel){this.match('vowel',vowel.dataset.vowel!);return;}
      const target=t.closest<HTMLElement>('[data-stroke-y]');if(target){this.placeStroke(Number(target.dataset.strokeY));return;}
      const piece=t.closest('#stroke-piece');if(piece){this.selected='stroke';piece.classList.add('selected');return;}
      const jamo=t.closest<HTMLElement>('[data-jamo]');if(jamo){this.jamo(jamo.dataset.jamo!);return;}
      const ans=t.closest<HTMLElement>('[data-answer]');if(ans)this.answer(Number(ans.dataset.answer));
    });
    this.root.addEventListener('submit',e=>{if((e.target as HTMLElement).id!=='nickname-form')return;e.preventDefault();const name=normalizeNickname(this.ui.querySelector<HTMLInputElement>('#nickname')!.value);if(!validNickname(name)){this.ui.querySelector('#name-error')!.textContent='한글·영문·숫자로 1~10자의 바른 닉네임을 적어 주세요.';return;}this.run.nickname=name;this.audio.play('portal');this.change('INTRO');});
    this.root.addEventListener('input',e=>{const t=e.target as HTMLInputElement;if(t.id==='volume')this.settings.volume=this.audio.volume=Number(t.value);if(t.id==='festival')this.settings.festivalMode=t.checked;this.audio.sync();try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}});
    window.addEventListener('keydown',e=>{
      this.idle=0;if((e.target as HTMLElement).matches('input,textarea'))return;
      if(this.modal){if(e.key==='Escape')this.closeModal();if(e.key==='Tab'){const controls=[...this.root.querySelectorAll<HTMLElement>('.modal button,.modal input,.modal a,.modal summary')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){last?.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first?.focus();e.preventDefault();}}return;}
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)&&this.run.phase==='STAGE1')e.preventDefault();
      this.keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&!e.repeat)this.interact();if(e.key==='Escape')this.action('pause');if(this.run.phase==='BONUS_QUIZ'&&/^[1-4]$/.test(e.key))this.answer(Number(e.key)-1);
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>{this.keys.clear();this.stick={x:0,z:0};this.persist();});
    document.addEventListener('visibilitychange',()=>{this.keys.clear();this.stick={x:0,z:0};this.audio.pause(document.hidden||this.paused);this.persist();});
    window.addEventListener('pagehide',()=>this.persist());window.addEventListener('resize',()=>this.world.resize());
    const canvas=this.root.querySelector('canvas')!;let dragging=false,x=0;
    canvas.addEventListener('pointerdown',e=>{if(this.run.phase!=='STAGE1')return;dragging=true;x=e.clientX;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(dragging){this.world.rotate((e.clientX-x)*.006);x=e.clientX;}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
  }
  private action(action:string){
    this.audio.play('click');this.idle=0;
    if(action==='start'||action==='restart')this.start();
    else if(action==='home')this.home();
    else if(action==='brand'){if(['START','ATTRACT','PLAYER_SETUP'].includes(this.run.phase))this.home();else this.action('pause');}
    else if(action==='resume'&&this.resume){this.run=this.resume;this.world.setPlayer(this.run.position.x,this.run.position.z);this.world.setCollected(this.run.collected);this.change(this.run.phase);}
    else if(action==='sound'){this.audio.enabled=!this.audio.enabled;this.settings.soundEnabled=this.audio.enabled;this.audio.sync();try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}const b=this.ui.querySelector('.sound-button');if(b)b.textContent=this.audio.enabled?'♪ 소리 켜짐':'♪ 소리 꺼짐';}
    else if(action==='help')this.showHelp();else if(action==='close-modal')this.closeModal();
    else if(action==='pause'){
      if(['RESULT','CERTIFICATE','RANKING','START','ATTRACT'].includes(this.run.phase))return;
      if(this.run.phase==='BONUS_QUIZ'){this.toast('60초 도전은 시간이 계속 흐릅니다.');return;}
      this.paused=true;this.audio.pause(true);this.openModal(`<h2>잠시 쉬어 가세요</h2><p>탐험을 이어가거나 처음부터 다시 시작할 수 있어요.</p>${this.button('quit-confirm','탐험 그만두기','text-button')}`);
    }else if(action==='quit-confirm'){this.openModal(`<h2>탐험을 끝낼까요?</h2><p>현재 진행은 사라지고, 저장된 순위는 남습니다.</p>${this.button('quit','끝내고 처음으로')}`);}
    else if(action==='quit'){this.closeModal();this.home();}
    else if(action==='enter-palace'){this.audio.play('portal');this.change('STAGE1');}
    else if(action==='interact')this.interact();else if(action==='next-stage')this.advance();
    else if(action==='bonus')this.change('BONUS_READY');else if(action==='quiz-countdown'){this.readyUntil=this.now()+3000;this.render();}
    else if(action==='certificate'){this.audio.play('certificate');this.change('CERTIFICATE');}
    else if(action==='ranking'){if(this.run.phase==='START'||this.run.phase==='ATTRACT'){this.run.phase='RANKING';this.render();}else this.change('RANKING');}
    else if(action==='download')this.download();
    else if(action==='clear-today'||action==='clear-all'){this.openModal(`<h2>${action==='clear-today'?'오늘':'전체'} 순위를 지울까요?</h2><p>이 기기의 ${action==='clear-today'?'오늘':'모든'} 기록이 삭제되며 되돌릴 수 없습니다.</p>${this.button(action==='clear-today'?'confirm-today':'confirm-all','기록 삭제','danger')}`);}
    else if(action==='confirm-today'||action==='confirm-all'){try{this.ranking.clear(action==='confirm-today');this.toast('선택한 기록을 초기화했습니다.');}catch{this.toast('기록을 지우지 못했습니다. 브라우저 저장 권한을 확인해 주세요.');}this.showAdmin();}
  }
  private bindJoystick(){
    const pad=this.ui.querySelector<HTMLElement>('#joystick');if(!pad)return;const knob=pad.querySelector<HTMLElement>('span')!;
    let held=false;const move=(e:PointerEvent)=>{const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,len=Math.max(40,Math.hypot(dx,dz));this.stick={x:dx/len,z:dz/len};knob.style.transform=`translate(${this.stick.x*32}px,${this.stick.z*32}px)`;};
    pad.addEventListener('pointerdown',e=>{held=true;pad.setPointerCapture(e.pointerId);move(e);e.preventDefault();});pad.addEventListener('pointermove',e=>{if(held)move(e);});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,()=>{held=false;this.stick={x:0,z:0};knob.style.transform='';});
  }
  private bindStroke(){const piece=this.ui.querySelector<HTMLElement>('#stroke-piece');if(!piece)return;let held=false;
    piece.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selected='stroke';piece.classList.add('selected');}});
    piece.addEventListener('pointerdown',e=>{held=true;this.selected='stroke';piece.classList.add('selected');piece.setPointerCapture(e.pointerId);});
    piece.addEventListener('pointerup',e=>{if(!held)return;held=false;piece.releasePointerCapture(e.pointerId);const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-stroke-y]');if(target)this.placeStroke(Number(target.dataset.strokeY));});piece.addEventListener('pointercancel',()=>{held=false;});
  }
  private tick=(stamp:number)=>{
    const dt=Math.min(.05,(stamp-this.last)/1000);this.last=stamp;this.frame++;
    if(!this.frozen){this.time+=dt;if(!this.modal)this.idle+=dt;
      if(!this.paused&&!this.modal&&!document.hidden){
        if(['INTRO','STAGE1','STAGE2','STAGE3','STAGE4','STAGE5'].includes(this.run.phase))this.run.elapsed+=dt;
        if(this.run.phase==='STAGE1'){
          const x=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0)+this.stick.x;
          const z=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0)+this.stick.z;
          this.world.move(x,z,dt);const near=this.world.nearest(),label=this.ui.querySelector('#near-label');if(label)label.textContent=near?`${near} 발견하기`:'글자를 찾아 가까이 가세요';
          const pos=this.world.getPlayer(),dot=this.ui.querySelector<HTMLElement>('#map-player');if(dot){dot.style.left=`${50+pos.x*2}%`;dot.style.top=`${50+pos.z*1.8}%`;}
        }
      }
      if(this.run.phase==='BONUS_READY'&&this.readyUntil){if(this.now()>=this.readyUntil)this.beginQuiz();else{const el=this.ui.querySelector('#countdown');if(el)el.textContent=String(Math.ceil((this.readyUntil-this.now())/1000));}}
      if(this.run.phase==='BONUS_QUIZ'){
        const left=Math.max(0,(this.run.quizDeadline-this.now())/1000),el=this.ui.querySelector('#quiz-time'),fill=this.ui.querySelector<HTMLElement>('#timer-fill');if(el)el.textContent=String(Math.ceil(left)).padStart(2,'0');if(fill)fill.style.width=`${left/config.bonusQuizDuration*100}%`;
        if(left<=0){if(this.modal)this.closeModal();this.finish();}else if(this.quizLocked&&this.now()>=this.quizFeedbackUntil){this.quizLocked=false;this.render();}
      }
      if(['RESULT','CERTIFICATE','RANKING'].includes(this.run.phase)&&this.settings.festivalMode&&!this.modal){const n=this.ui.querySelector('#reset-count');if(n)n.textContent=String(Math.max(0,Math.ceil(config.autoResetSeconds-this.idle)));if(this.idle>=config.autoResetSeconds)this.home();}
      if(this.run.phase==='START'&&this.idle>=config.attractSeconds)this.change('ATTRACT');
      if(!this.paused)this.world.update(dt,this.reduced?0:this.time);
      this.audio.update(this.time,!this.paused&&!document.hidden&&this.run.phase!=='BONUS_QUIZ');
      this.saveClock+=dt;if(this.saveClock>=2){this.saveClock=0;this.persist();}
    }
    this.world.render();
    if(import.meta.env.DEV||import.meta.env.VITE_TEST_MODE==='true'){
      (window as any).__THREE_GAME_DIAGNOSTICS__={...this.world.diagnostics(),renderer:this.world.diagnostics(),canvas:{clientWidth:innerWidth,clientHeight:innerHeight,width:this.world.renderer.domElement.width,height:this.world.renderer.domElement.height,dpr:this.world.renderer.getPixelRatio()},frame:this.frame,elapsed:this.run.elapsed,score:total(this.run.scores),targetScore:5500,complete:['RESULT','CERTIFICATE','RANKING'].includes(this.run.phase),phase:this.run.phase,player:{position:{...this.world.getPlayer(),y:0},speed:0},collected:[...this.run.collected]};
    }
    requestAnimationFrame(this.tick);
  };
  private installHooks(){
    if(!(import.meta.env.DEV||import.meta.env.VITE_TEST_MODE==='true'))return;const self=this;
    (window as any).__THREE_GAME_TEST_HOOKS__={seed(n:number){self.rng=createSeededRandom(n);},setState(name:string){
      const map:Record<string,Phase>={'active-play':'STAGE1',puzzle:'STAGE2',stroke:'STAGE4',quiz:'BONUS_QUIZ',result:'RESULT',title:'START'};if(!map[name])throw Error('Unknown state '+name);
      self.run=freshRun();self.run.nickname='한글탐험가';self.world.setCollected([]);self.world.setPlayer(0,15);
      if(name==='quiz')self.beginQuiz();else{if(name==='result')self.run.scores={exploration:500,puzzle:4000,quiz:2000,combo:400,time:500,completion:1000};self.change(map[name]);}return {state:name};
    },setPausedForScreenshot(v:boolean){self.frozen=v;},setReducedMotion(v:boolean){self.reduced=v;self.world.update(0,0);},hideDebugUi(){},advanceTime(ms:number){self.testClockOffset+=ms;},snapshot(){return structuredClone(self.run);},setPlayer(x:number,z:number){self.world.setPlayer(x,z);},getPickups(){return PICKUPS;},setIdle(seconds:number){self.idle=seconds;}};
  }
}
