import { questions } from '../data/questions';
export type Phase = 'START'|'ATTRACT'|'PLAYER_SETUP'|'INTRO'|'STAGE1'|'STAGE2'|'STAGE3'|'STAGE4'|'STAGE5'|'RESTORE'|'BONUS_READY'|'BONUS_QUIZ'|'RESULT'|'CERTIFICATE'|'RANKING';
export type Scores = {exploration:number;puzzle:number;quiz:number;combo:number;time:number;completion:number};
export interface RunState {
  version:1; id:string; phase:Phase; nickname:string; collected:string[]; solved:string[];
  scores:Scores; elapsed:number; position:{x:number;z:number}; quizOrder:number[]; quizIndex:number; quizDeadline:number; combo:number; bestCombo:number; saved:boolean;
}
export const RUN_KEY='hunmin-run-v1';
export const SETTINGS_KEY='hunmin-settings-v1';
export function freshRun():RunState {return {version:1,id:crypto.randomUUID(),phase:'START',nickname:'',collected:[],solved:[],scores:{exploration:0,puzzle:0,quiz:0,combo:0,time:0,completion:0},elapsed:0,position:{x:0,z:15},quizOrder:[],quizIndex:0,quizDeadline:0,combo:0,bestCombo:0,saved:false};}
export function total(s:Scores){return Object.values(s).reduce((a,b)=>a+b,0);}
export function titleFor(score:number){return score>=10000?'세종의 수제자':score>=8000?'한글 지킴이':score>=6500?'훈민정음 연구가':score>=5500?'집현전 연구원':score>=4500?'우리말 탐험가':'한글 새싹';}
export function loadRun():RunState|null {
  try {const value=JSON.parse(localStorage.getItem(RUN_KEY)||'null') as RunState|null;
    if(!value || value.version!==1 || !['INTRO','STAGE1','STAGE2','STAGE3','STAGE4','STAGE5','RESTORE','BONUS_READY','BONUS_QUIZ','RESULT','CERTIFICATE','RANKING'].includes(value.phase))return null;
    if(typeof value.id!=='string'||typeof value.nickname!=='string'||value.nickname.length>20||!Array.isArray(value.collected)||!Array.isArray(value.solved)||!Array.isArray(value.quizOrder))return null;
    if(!value.scores||!['exploration','puzzle','quiz','combo','time','completion'].every(k=>Number.isFinite(value.scores[k as keyof Scores])&&value.scores[k as keyof Scores]>=0))return null;
    if(!Number.isFinite(value.elapsed)||!Number.isFinite(value.quizDeadline)||!Number.isFinite(value.quizIndex)||!value.position||!Number.isFinite(value.position.x)||!Number.isFinite(value.position.z))return null;
    if(!Number.isInteger(value.quizIndex)||value.quizIndex<0||!Number.isInteger(value.combo)||value.combo<0||!Number.isInteger(value.bestCombo)||value.bestCombo<0)return null;
    if(!value.collected.every(c=>typeof c==='string'&&['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'].includes(c))||new Set(value.collected).size!==value.collected.length||!value.solved.every(c=>typeof c==='string'))return null;
    if(value.phase==='BONUS_QUIZ'&&(!value.quizOrder.length||!value.quizOrder.every(i=>Number.isInteger(i)&&i>=0&&i<questions.length)))return null;
    return value;
  }catch{return null;}
}
export function normalizeNickname(input:string):string {return [...input.trim().replace(/\s+/g,' ')].slice(0,10).join('');}
export function validNickname(name:string){return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 _-]{1,10}$/.test(name)&&!/(시발|씨발|병신|개새끼|fuck|shit)/i.test(name);}
