export interface RankingEntry { id: string; nickname: string; score: number; title: string; date: string }
export interface RankingService { list(todayOnly?: boolean): RankingEntry[]; save(entry: RankingEntry): void; clear(todayOnly: boolean): void }
const KEY = 'hunmin-ranking-v1';
export function seoulDay(date: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}
function valid(value: unknown): value is RankingEntry {
  if (!value || typeof value !== 'object') return false;
  const r = value as RankingEntry;
  return typeof r.id === 'string' && typeof r.nickname === 'string' && typeof r.title === 'string' && typeof r.score === 'number' && Number.isFinite(r.score) && r.score >= 0 && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date));
}
export class LocalRankingService implements RankingService {
  list(todayOnly = false): RankingEntry[] {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      const today = seoulDay(new Date());
      return raw.filter(valid).filter(r => !todayOnly || seoulDay(r.date) === today)
        .sort((a, b) => b.score - a.score || Date.parse(a.date) - Date.parse(b.date) || a.id.localeCompare(b.id)).slice(0, 500);
    } catch { return []; }
  }
  save(entry: RankingEntry): void {
    if (!valid(entry)) throw new Error('기록 정보가 올바르지 않습니다.');
    const all = this.list().filter(r => r.id !== entry.id);
    all.push({ ...entry, nickname: entry.nickname.slice(0, 20), title: entry.title.slice(0, 60), date: new Date(entry.date).toISOString() });
    // Retain recent participation, independent of score. list() applies leaderboard order.
    all.sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || (a.id === entry.id ? -1 : b.id === entry.id ? 1 : a.id.localeCompare(b.id)));
    try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, 500))); }
    catch { throw new Error('브라우저에 기록을 저장하지 못했습니다. 저장 공간과 개인정보 보호 설정을 확인해 주세요.'); }
  }
  clear(todayOnly: boolean): void {
    try {
      if (!todayOnly) localStorage.removeItem(KEY);
      else { const today = seoulDay(new Date()); localStorage.setItem(KEY, JSON.stringify(this.list().filter(r => seoulDay(r.date) !== today))); }
    } catch { throw new Error('기록을 지우지 못했습니다. 브라우저 저장 설정을 확인해 주세요.'); }
  }
}
