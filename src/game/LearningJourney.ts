import { organIllustration } from './OrganIllustrations';
import { principles, sources } from '../data/educationContent';
import { questions } from '../data/questions';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
const link = (url: string, text: string) => /^https:\/\//.test(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>` : esc(text);
const chapters = [
  { name:'글자 찾기', goal:'빛나는 자음 기본자 다섯 개를 찾으세요.', line:'책의 첫 장이 비었어요. 궁궐에 흩어진 글자 조각을 함께 찾아주세요.' },
  { name:'자음의 비밀', goal:'기본자와 해례에서 설명한 발음 기관을 연결하세요.', line:'입에서 찾은 글자의 원리! 위치도를 살펴보고 다섯 기본자의 비밀을 풀어주세요.' },
  { name:'천·지·인', goal:'모음 기본자를 하늘·땅·사람과 연결하세요.', line:'하늘과 땅, 그리고 사람. 세 가지 모습을 찾으면 다음 책장이 되살아나요.' },
  { name:'가획의 방', goal:'금빛 획을 알맞은 위치에 놓으세요.', line:'기본자에서 새 글자로! 획을 더하는 원리를 찾아 네 번째 책장을 채워주세요.' },
  { name:'모아쓰기', goal:'초성·중성·종성을 모아 ‘한’과 ‘글’을 만드세요.', line:'낱글자의 소리를 모아 한 음절로 써보세요. 마지막 책장이 기다리고 있어요.' },
];

export function chapterGuide(phase: string): string {
  const chapter = chapters[Number(phase.replace('STAGE','')) - 1];
  if (!chapter) return '';
  return `<details class="journey-guide"><summary><span class="journey-guide-seal" aria-hidden="true">賢</span><span><small>길잡이 · 가상의 집현전 견습 학자</small><strong>${chapter.goal}</strong></span><span aria-hidden="true">＋</span></summary><p>“${chapter.line}”</p><small>이 인물과 대사는 학습을 위해 만든 이야기입니다.</small></details>`;
}

export function restorationBook(completed: number): string {
  const count = Math.max(0, Math.min(5, Math.floor(Number.isFinite(completed) ? completed : 0)));
  return `<div class="journey-book" aria-label="배움의 책 ${count}장 완료, 전체 5장"><div class="journey-book-heading"><span>배움의 책 <small>訓民正音</small></span><b>${count} / 5장</b></div><ol>${chapters.map((c,i) => `<li class="${i < count ? 'is-restored' : ''}"><span aria-hidden="true">${i < count ? '✓' : '·'}</span><span>${c.name}</span><small>${i < count ? '복원' : '빈 책장'}</small></li>`).join('')}</ol></div>`;
}

const glyphPaths: Record<string,string[]> = {
  'ㄱ':['M25 25 H80 V82'], 'ㄴ':['M25 25 V82 H80'], 'ㅁ':['M25 25 H80 V82 H25 Z'],
  'ㅅ':['M52 25 L22 82','M52 25 L82 82'], 'ㅇ':['M52 24 A29 29 0 1 1 51.9 24'],
  'ㅋ':['M25 25 H80 V82','M25 53 H80'], 'ㄷ':['M25 25 V82 H80','M25 25 H80'],
  'ㅌ':['M80 25 H25 V82 H80','M25 53 H80'], 'ㅂ':['M25 16 V82 H80 V16','M25 50 H80'],
  'ㅍ':['M18 25 H86','M32 25 V82','M72 25 V82','M18 82 H86'],
  'ㅈ':['M52 25 L22 82','M52 25 L82 82','M22 25 H82'],
  'ㅊ':['M52 30 L22 82','M52 30 L82 82','M22 30 H82','M38 12 H66'],
  'ㆍ':['M50 49 H50.1'], 'ㅡ':['M20 53 H84'], 'ㅣ':['M52 18 V86'],
};
function drawnGlyph(char: string, addedStroke = false): string {
  const paths = glyphPaths[char];
  if (!paths) return `<span class="journey-result-glyph">${esc(char)}</span>`;
  return `<svg class="journey-glyph ${addedStroke ? 'journey-glyph-added' : ''}" viewBox="0 0 104 104" role="img" aria-label="${esc(char)} ${addedStroke ? '기존 선이 먼저 나타난 뒤 새 획이 금빛으로 더해지는 모습' : '글자의 선이 나타나는 모습'}">${paths.map((d,i)=>`<path class="${addedStroke && i === paths.length - 1 ? 'new-stroke' : 'base-stroke'}" d="${d}" pathLength="1" style="--stroke-order:${i}"/>`).join('')}</svg>`;
}
const organText: Record<string,string> = {
  'ㄱ':'해례에서는 혀뿌리가 목구멍을 막는 모습을 본떴다고 설명해요.',
  'ㄴ':'해례에서는 혀가 윗잇몸에 붙는 모습을 본떴다고 설명해요.',
  'ㅁ':'해례에서는 입의 모습을 본떴다고 설명해요.',
  'ㅅ':'해례에서는 이의 모습을 본떴다고 설명해요. 이를 맞부딪쳐 내는 소리라는 뜻은 아니에요.',
  'ㅇ':'해례에서는 목구멍의 모습을 본떴다고 설명해요. 현대 초성 ㅇ은 소리가 없고, 받침 ㅇ은 혀 뒤쪽을 사용하는 코소리예요.',
};
export function discoveryMarkup(kind: 'organ'|'vowel'|'stroke'|'syllable', char: string, from?: string): string {
  let image = '', text = '', title = '';
  if (kind === 'organ') {
    image = `<div class="journey-organ-detail">${organIllustration(char)}</div><div class="journey-draw">${drawnGlyph(char)}</div>`;
    title = `${char}의 상형 원리`; text = organText[char] || '';
    text += ' 위치도와 글자의 선을 함께 살펴보세요. 기관의 발음 동작을 재현한 애니메이션은 아니에요.';
  } else if (kind === 'vowel') {
    const nature: Record<string,string> = {'ㆍ':'하늘 天','ㅡ':'땅 地','ㅣ':'사람 人'};
    image = `<div class="journey-origin">${esc(nature[char] || '')}</div><span class="journey-arrow" aria-hidden="true">→</span>${drawnGlyph(char)}`;
    title = `${char}의 상형 원리`; text = `모음 기본자 ${char}는 ${({'ㆍ':'둥근 하늘','ㅡ':'평평한 땅','ㅣ':'서 있는 사람'} as Record<string,string>)[char] || '자연의 모습'}을 본떴어요.`;
  } else if (kind === 'stroke') {
    image = `<div class="journey-before">${esc(from || '')}</div><span class="journey-arrow" aria-hidden="true">→</span>${drawnGlyph(char, true)}`;
    title = `${from ? from + '에서 ' : ''}${char}으로`; text = '기본자에 획을 더해 관련된 소리의 글자를 만드는 가획 원리예요. 글꼴에 따라 기존 선의 길이와 모양도 달라질 수 있어요.';
  } else {
    const parts = char === '한' ? ['ㅎ','ㅏ','ㄴ'] : char === '글' ? ['ㄱ','ㅡ','ㄹ'] : [];
    image = `<div class="journey-assembly">${parts.map((p,i)=>`<span style="--stroke-order:${i}"><small>${['초성','중성','종성'][i]}</small>${p}</span>`).join('')}</div><span class="journey-arrow" aria-hidden="true">→</span>${drawnGlyph(char)}`;
    title = `${char}의 모아쓰기`; text = '초성과 중성, 필요한 경우 종성을 한 음절로 모아 써요. 낱글자를 나란히 늘어놓지 않고 한 음절 안에 모으는 것이 한글의 특징이에요.';
  }
  return `<section class="journey-discovery" aria-label="방금 발견한 원리"><div class="journey-discovery-heading"><span>✦ 방금 발견한 원리</span><strong>${esc(title)}</strong><button class="journey-replay" data-action="replay-discovery" aria-label="${esc(title)} 움직임 다시 보기">↻ 다시 보기</button></div><div class="journey-discovery-art ${kind === 'organ' ? 'has-organ' : ''} ${kind === 'stroke' ? 'has-added-stroke' : ''}">${image}</div><p>${esc(text)}</p><small>${link(sources[1].url,'국립국어원 · 글자 만들기 원리')}</small></section>`;
}

export function journalMarkup(run: any): string {
  const solved: string[] = Array.isArray(run.solved) ? run.solved.filter((s: unknown) => typeof s === 'string') : [];
  const found: string[] = Array.isArray(run.collected) ? run.collected.filter((s: unknown) => typeof s === 'string' && ['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'].includes(s as string)) : [];
  const done = [found.length === 5, ['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'].every(c=>solved.includes('organ-'+c)), ['ㆍ','ㅡ','ㅣ'].every(c=>solved.includes('vowel-'+c)), Array.from({length:7},(_,i)=>i).every(i=>solved.includes('stroke-'+i)), solved.includes('word-한') && solved.includes('word-글')];
  const hasMistakeRecord = Array.isArray(run.quizMistakes);
  const mistakes = [...new Set<number>(hasMistakeRecord ? run.quizMistakes.filter((id:unknown)=>Number.isInteger(id)) : [])];
  const review = questions.filter(q=>mistakes.includes(q.id));
  return `<div class="journey-journal"><span class="eyebrow">탐험 뒤에도 이어지는 배움</span><h1>나의 훈민정음 도감</h1><p>${esc(run.nickname || '한글 지킴이')} 님이 발견한 원리를 다시 펼쳐 보세요.</p>${restorationBook(done.filter(Boolean).length)}<section><h2>발견한 글자</h2><div class="journey-found">${[...new Set(found)].map(c=>`<span>${esc(c)}</span>`).join('') || '<p>아직 발견한 글자가 없어요.</p>'}</div></section><section><h2>다시 펼치는 다섯 원리</h2><ol class="journey-principles">${chapters.map((c,i)=>`<li><div><strong>${esc(c.name)}</strong><small>${done[i] ? '탐험 완료' : '아직 탐험 중'}</small></div><p>${esc(principles[i].text)}</p></li>`).join('')}</ol></section><section><h2>틀린 문제 다시 보기 <small>${review.length}개</small></h2>${review.length ? review.map(q=>`<details class="journey-review"><summary>${esc(q.question)}</summary><p><strong>바른 답: ${esc(q.choices[q.answer])}</strong></p><p>${esc(q.explanation)}</p>${link(q.source,'근거 자료 확인')}</details>`).join('') : `<p class="journey-empty">${!hasMistakeRecord ? '이전 탐험에는 오답 기록이 없어요. 새 탐험부터 틀린 문제를 모아둘게요.' : run.quizIndex > 0 ? '기록된 오답이 없어요. 잘했어요!' : '추가 도전에서 틀린 문제를 여기에 모아둘게요.'}</p>`}</section><details class="journey-references"><summary>배움의 근거 자료</summary><ul>${sources.map(s=>`<li>${link(s.url,s.title)}</li>`).join('')}</ul></details><p class="subtle">도감과 오답 기록은 현재 기기의 브라우저에 저장됩니다. 예전 탐험에는 오답 기록이 없을 수 있어요.</p></div>`;
}
