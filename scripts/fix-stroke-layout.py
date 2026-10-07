from pathlib import Path
p=Path('src/config/gameConfig.ts');s=p.read_text(encoding='utf-8');p.write_text(s.replace("schoolName: '우리 학교'", "schoolName: '대전성모여자고등학교'"),encoding='utf-8')
p=Path('src/game/FestivalGame.ts');s=p.read_text(encoding='utf-8');needle="const stages=['집현전을 찾아라'"
helper='''// The SVG and drop zones share a 100 x 100 coordinate system, independent of fonts.
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
'''
s=s.replace(needle,helper+needle)
s=s.replace('<span class="base-glyph">${st.from}</span>', '${strokeDrawing(idx)}')
s=s.replace('ㅁ→ㅂ, ㅂ→ㅍ은 더해진 획에 맞게 기존 획의 길이도 달라집니다.', "${idx===3||idx===4?'이 문제는 기존 획의 길이와 배치를 조정한 조립용 밑그림입니다. 점선에 획을 놓아 목표 글자를 완성하세요.':'점선의 가운데에 금빛 획이 놓입니다.'}")
p.write_text(s,encoding='utf-8')
p=Path('src/styles.css');s=p.read_text(encoding='utf-8');s+='\n.stroke-diagram{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.stroke-diagram path{fill:none;stroke:#eddfbd;stroke-width:6;stroke-linecap:square;stroke-linejoin:miter}.stroke-board .stroke-target{left:17%;width:66%;border-radius:2px}.stroke-board .stroke-target::after{content:"";position:absolute;left:4.545%;right:4.545%;top:50%;border-top:1px solid #e6bc5a66;pointer-events:none}\n';p.write_text(s,encoding='utf-8')
