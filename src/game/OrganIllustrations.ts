// Anatomy: unaltered VocalTract.svg by Tavin (CC BY 3.0).
// Overlays indicate organ locations only, not speech postures.
const base = `${import.meta.env.BASE_URL}education/vocal-tract.svg`;
const marks: Record<string, { title: string; target: string; line: string }> = {
 'ㅁ': { title: '위·아래 입술', target: '<ellipse cx="49" cy="229" rx="12" ry="23"/>', line: 'M49 207 L104 163 H174' },
 'ㅅ': { title: '앞니', target: '<ellipse cx="67" cy="227" rx="8" ry="21"/>', line: 'M67 207 L111 163 H199' },
 'ㄱ': { title: '혀뿌리 · 혀 뒤쪽', target: '<ellipse cx="168" cy="269" rx="12" ry="22"/>', line: 'M173 248 L224 178 V169' },
 'ㄴ': { title: '혀끝 · 윗잇몸', target: '<ellipse cx="87" cy="229" rx="9" ry="8"/><ellipse cx="82" cy="207" rx="9" ry="7"/>', line: 'M87 220 L135 163 H174' },
 'ㅇ': { title: '목구멍의 통로', target: '<path d="M183 216 Q190 251 190 283 L180 283 Q184 249 176 216 Z"/>', line: 'M185 245 L232 184 V169' },
};
export function organIllustration(char: string): string {
 const m = marks[char] ?? marks['ㅇ'];
 return `<svg class="organ-illustration" viewBox="0 135 300 275" role="img" aria-label="옆에서 본 발음기관 위치도: ${m.title}. 발음 동작을 나타내는 그림이 아닙니다." xmlns="http://www.w3.org/2000/svg">
 <rect x="0" y="135" width="300" height="275" rx="12" fill="#faf7ee"/>
 <image href="${base}" x="0" y="0" width="378" height="400"/>
 <text x="121" y="267" text-anchor="middle" fill="#596269" font-size="16">혀</text>
 <g fill="#d9922540" stroke="#b16c00" stroke-width="2.5">${m.target}</g>
 <path d="${m.line}" fill="none" stroke="#925800" stroke-width="2"/>
 <text x="228" y="158" text-anchor="middle" fill="#25444a" font-size="15" font-weight="700">${m.title}</text>
 <text x="150" y="403" text-anchor="middle" fill="#25444a" font-size="14">옆에서 본 기관의 위치</text></svg>`;
}
