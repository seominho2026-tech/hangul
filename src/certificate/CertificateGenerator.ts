/** Build an exportable canvas; only same-origin and uploaded image data logos are accepted. */
export async function createCertificate(nickname: string, score: number, title: string, schoolName: string, schoolLogo: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서는 인증서를 만들 수 없습니다.');
  ctx.fillStyle = '#f8f1df'; ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = '#102e32'; ctx.fillRect(0, 0, 1080, 260);
  ctx.strokeStyle = '#b18b42'; ctx.lineWidth = 3; ctx.strokeRect(38, 38, 1004, 1364);
  ctx.lineWidth = 1; ctx.strokeRect(51, 51, 978, 1338);
  const text = (value: string, y: number, size: number, color = '#173b3c', weight = '500', maxWidth = 880) => {
    ctx.fillStyle = color; ctx.textAlign = 'center';
    let actual = size; ctx.font = `${weight} ${actual}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
    while (ctx.measureText(value).width > maxWidth && actual > 14) { actual -= 1; ctx.font = `${weight} ${actual}px "Noto Sans KR", "Malgun Gothic", sans-serif`; }
    ctx.fillText(value, 540, y);
  };
  text('HANGEUL · SCHOOL FESTIVAL', 115, 23, '#d5b778', '600');
  text('훈민정음 : 사라진 글자를 찾아라', 182, 36, '#fff9e8', '700');
  text('한글 지킴이 인증서', 389, 64, '#173b3c', '800');
  text('CERTIFICATE OF ACHIEVEMENT', 435, 19, '#967333', '600');
  ctx.strokeStyle = '#cbb580'; ctx.beginPath(); ctx.moveTo(340, 484); ctx.lineTo(740, 484); ctx.stroke();
  text(nickname.slice(0, 20) || '한글 탐험가', 590, 61, '#173b3c', '800');
  text('위 참가자는 사라진 글자를 찾는 여정에서', 678, 29);
  text('훈민정음의 원리와 한글의 소중함을 배우고', 727, 29);
  text('한글 지킴이 도전을 완수하였기에', 776, 29);
  text('이 인증서를 드립니다.', 825, 29);
  ctx.fillStyle = '#eae1c9'; ctx.fillRect(200, 877, 680, 156);
  text(title.slice(0, 60), 933, 31, '#6d5125', '700');
  text(`${Math.max(0, Math.round(Number.isFinite(score) ? score : 0)).toLocaleString('ko-KR')} 점`, 993, 44, '#173b3c', '800');
  text(new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()), 1108, 25);
  text(schoolName.slice(0, 60) || '한글날 학교 축제', 1182, 32, '#173b3c', '700');
  if (schoolLogo) {
    let safe = false;
    try { safe = /^data:image\/(png|jpeg|webp);base64,/i.test(schoolLogo) || new URL(schoolLogo, location.href).origin === location.origin; } catch { /* An invalid logo does not prevent export. */ }
    if (safe) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      const loaded = await new Promise<boolean>(resolve => {
        const timeout = window.setTimeout(() => resolve(false), 3500);
        img.onload = () => { window.clearTimeout(timeout); resolve(true); };
        img.onerror = () => { window.clearTimeout(timeout); resolve(false); };
        img.src = schoolLogo;
      });
      if (loaded && img.naturalWidth > 0) {
        const size = Math.min(100 / img.naturalWidth, 80 / img.naturalHeight);
        ctx.drawImage(img, 540 - img.naturalWidth * size / 2, 1210, img.naturalWidth * size, img.naturalHeight * size);
      }
    }
  }
  text('백성을 위한 글자, 우리가 이어 가는 마음', 1340, 22, '#8b713f');
  return canvas;
}
