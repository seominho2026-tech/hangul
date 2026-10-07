import './styles.css';
import { FestivalGame } from './game/FestivalGame';
const root=document.querySelector<HTMLDivElement>('#app')!;
const creatorCredit=document.createElement('footer');
creatorCredit.className='creator-credit';
creatorCredit.textContent='만든이: 서 민 호 (대전성모여자고등학교 국어교사)';
document.body.append(creatorCredit);
try { new FestivalGame(root); } catch (error) { console.error(error); root.innerHTML='<main class="fatal"><h1>3D 화면을 열 수 없습니다</h1><p>크롬 브라우저의 그래픽 가속을 켠 뒤 새로고침해 주세요.</p><button onclick="location.reload()">다시 열기</button></main>'; }
