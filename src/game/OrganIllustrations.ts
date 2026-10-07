type Organ = 'ㄱ' | 'ㄴ' | 'ㅁ' | 'ㅅ' | 'ㅇ';
const shell=(label:string,body:string)=>`<svg class="organ-illustration" viewBox="0 0 240 190" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="236" height="186" rx="12" fill="#f5ead5"/>${body}</svg>`;
const label=(text:string,x:number,y:number)=>`<text x="${x}" y="${y}" fill="#25444a" font-size="17" font-weight="700" text-anchor="middle">${text}</text>`;
const tooth=(x:number,y:number,w=24,h=29)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fffdf3" stroke="#a69b86" stroke-width="1.6"/>`;
function sideView(tip:boolean){
 const tongue=tip?'M98 126 Q120 112 155 119 Q180 127 189 94 Q199 89 200 102 Q193 143 161 148 L108 149 Z':'M98 132 Q98 83 124 88 Q133 110 167 118 L196 122 Q188 150 147 150 L104 151 Z';
 return `<path d="M80 172 L82 136 Q53 102 66 67 Q78 26 137 27 Q178 28 190 57 L206 72 L199 81 L210 92 L204 100 L209 111 Q203 147 166 157 L163 174" fill="#dfb599" stroke="#a87c65" stroke-width="2"/>
 <path d="M90 70 Q140 49 188 83 L202 99 L198 130 Q158 153 106 145 L94 171 L78 170 L86 123 Z" fill="#503c47"/>
 <path d="M97 75 Q145 56 186 84" fill="none" stroke="#edb79c" stroke-width="9" stroke-linecap="round"/>
 ${tooth(181,86,13,19)}${tooth(182,130,13,14)}
 <path d="${tongue}" fill="#dc887b" stroke="#ad5d58" stroke-width="2.5"/>
 <path d="M104 152 L91 174" stroke="#dc887b" stroke-width="7"/>
 <circle cx="${tip?190:114}" cy="${tip?101:103}" r="14" fill="#e6b94444" stroke="#b77a18" stroke-width="3"/>
 <path d="M${tip?'188 86 L177 49 H153':'108 89 L70 46 H38'}" fill="none" stroke="#b77a18" stroke-width="2.5"/>
 ${label(tip?'혀끝':'혀뿌리',tip?166:43,37)}${label('옆에서 본 입안',135,184)}`;
}
export function organIllustration(char:string):string{
 const organ=char as Organ;
 if(organ==='ㄱ'||organ==='ㄴ')return shell(organ==='ㄱ'?'입안 옆면: 뒤쪽 혀뿌리가 목구멍 쪽으로 올라간 모습':'입안 옆면: 앞쪽 혀끝이 윗잇몸에 닿는 모습',sideView(organ==='ㄴ'));
 if(organ==='ㅁ')return shell('정면에서 본 입: 위아래 입술과 입안, 치아',`
 <path d="M30 96 Q78 58 106 71 Q120 58 135 71 Q165 58 210 96 Q175 152 120 151 Q65 152 30 96" fill="#ce7a70" stroke="#a75250" stroke-width="3"/>
 <path d="M43 99 Q120 77 197 99 Q168 128 120 130 Q70 127 43 99" fill="#52323e"/>
 ${[69,94,119,144].map(x=>tooth(x,91,24,16)).join('')}
 <path d="M64 127 Q120 150 176 127" fill="none" stroke="#efada0" stroke-width="5"/>
 <path d="M120 65 V42" stroke="#b77a18" stroke-width="2.5"/>${label('입술',120,32)}${label('정면에서 본 입',120,178)}`);
 if(organ==='ㅅ')return shell('정면에서 본 이: 분홍빛 잇몸에 붙은 위아래 치아',`
 <path d="M33 76 Q120 44 207 76 L207 96 H33 Z" fill="#d88a85"/>
 <path d="M33 139 Q120 165 207 139 L207 120 H33 Z" fill="#d88a85"/>
 ${[42,69,96,123,150,177].map((x,i)=>tooth(x,76,23,i===2||i===3?35:30)+tooth(x,115,23,27)).join('')}
 <path d="M108 72 V42 H84" fill="none" stroke="#b77a18" stroke-width="2.5"/>${label('앞니',80,32)}${label('정면에서 본 치아',120,179)}`);
 return shell('입을 벌려 정면에서 본 목구멍: 치아 안쪽의 목젖과 어두운 통로',`
 <ellipse cx="120" cy="106" rx="78" ry="63" fill="#bd746f" stroke="#955259" stroke-width="3"/>
 <ellipse cx="120" cy="105" rx="59" ry="49" fill="#653d49"/>
 <path d="M80 74 Q120 61 160 74" fill="none" stroke="#fff8e7" stroke-width="13"/>
 <ellipse cx="120" cy="102" rx="28" ry="25" fill="#292c39" stroke="#d9ad58" stroke-width="3"/>
 <path d="M108 75 Q120 68 132 75 L126 91 Q120 98 114 91 Z" fill="#e5a096"/>
 <path d="M67 138 Q120 108 173 138 Q158 160 120 160 Q81 160 67 138" fill="#e39b8b"/>
 <path d="M145 98 L187 46 H206" fill="none" stroke="#b77a18" stroke-width="2.5"/>
 ${label('목구멍',187,34)}${label('입안 깊숙한 통로',120,182)}`);
}
