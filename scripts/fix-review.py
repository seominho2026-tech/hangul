from pathlib import Path
p=Path('src/game/FestivalGame.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace("private home(){this.run=freshRun();", "private home(){if(!this.run.nickname&&this.resume){this.run=freshRun();this.change('START');return;}this.run=freshRun();")
s=s.replace("this.run.saved?this.button('certificate'", "this.run.scores.completion>0?this.button('certificate'")
s=s.replace("import { questions }", "import { sources } from '../data/educationContent';\nimport { questions }")
s=s.replace('<a href="https://www.hangeul.go.kr/" target="_blank" rel="noopener noreferrer">국립한글박물관</a> · <a href="https://stdict.korean.go.kr/" target="_blank" rel="noopener noreferrer">국립국어원 표준국어대사전</a>', '${sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join("<br>")}')
s=s.replace("this.run.scores.completion>0?this.button", "this.run.scores.completion>0?this.button")
s=s.replace("...this.world.diagnostics(),frame:", "...this.world.diagnostics(),renderer:this.world.diagnostics(),canvas:{clientWidth:innerWidth,clientHeight:innerHeight,width:this.world.renderer.domElement.width,height:this.world.renderer.domElement.height,dpr:this.world.renderer.getPixelRatio()},frame:")
s=s.replace("this.change(map[name]);}return", "this.change(map[name]);}for(let i=0;i<80;i++)self.world.update(.05,0);return")
s=s.replace("if(!map[name])throw", "if(!map[name])throw")
# Correct self reference in test hooks
s=s.replace("for(let i=0;i<80;i++)self.world.update(.05,0);", "for(let i=0;i<80;i++)self.world.update(.05,0);")
p.write_text(s,encoding='utf-8')
p=Path('src/core/RunState.ts');s=p.read_text(encoding='utf-8-sig');s="import { questions } from '../data/questions';\n"+s
s=s.replace('    return value;', "    if(!Number.isInteger(value.quizIndex)||value.quizIndex<0||!Number.isInteger(value.combo)||value.combo<0||!Number.isInteger(value.bestCombo)||value.bestCombo<0)return null;\n    if(!value.collected.every(c=>typeof c==='string'&&['ㄱ','ㄴ','ㅁ','ㅅ','ㅇ'].includes(c))||new Set(value.collected).size!==value.collected.length||!value.solved.every(c=>typeof c==='string'))return null;\n    if(value.phase==='BONUS_QUIZ'&&(!value.quizOrder.length||!value.quizOrder.every(i=>Number.isInteger(i)&&i>=0&&i<questions.length)))return null;\n    return value;")
p.write_text(s,encoding='utf-8')
p=Path('.gitignore');p.write_text('node_modules/\ndist/\ndist-test/\ntest-results/\nplaywright-report/\nartifacts/**/*.png\nartifacts/**/*.webm\nartifacts/**/*.json\n*.log\n.env*\n.vercel/\n.auth/\n*.pem\n.DS_Store\n',encoding='utf-8')
