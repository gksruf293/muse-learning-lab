// 먼저 직접 실습한 뒤 비교할 참고 구현이다.
export function analyzeReference(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  if (lines[0] !== 'date,lesson,minutes,completed') throw new Error('CSV 열 이름이 다르다.');
  const valid = [], errors = [];
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    const [date, lesson, rawMinutes, completed] = columns;
    const reasons = [];
    if (columns.length !== 4) reasons.push('열 개수가 4개가 아님');
    if (rawMinutes === undefined || rawMinutes.trim() === '') reasons.push('학습 시간 누락');
    else if (!Number.isFinite(Number(rawMinutes)) || Number(rawMinutes) < 0) reasons.push('학습 시간이 유효한 0 이상의 수가 아님');
    if (!['true', 'false'].includes(completed)) reasons.push('완료 값이 true/false가 아님');
    if (reasons.length) {errors.push({line: i + 1, reasons}); continue;}
    valid.push({date, lesson, minutes: Number(rawMinutes), completed: completed === 'true'});
  }
  const totalMinutes = valid.reduce((sum, row) => sum + row.minutes, 0);
  const completedCount = valid.filter(row => row.completed).length;
  return {
    validCount: valid.length, errors, totalMinutes,
    averageMinutes: valid.length ? totalMinutes / valid.length : null,
    completedCount, completionRate: valid.length ? completedCount / valid.length : null
  };
}

export function searchContent(query, data) {
  const keyword = query.toLowerCase();
  return data.filter(row => `${row.title} ${row.text}`.toLowerCase().includes(keyword));
}
export function formatResults(hits) {
  return hits.map(row => ({id: row.id, label: `${row.title}: ${row.text}`}));
}
export function queryRouteReference(request, data) {
  const query = typeof request.query === 'string' ? request.query.trim() : '';
  if (!query) return {status: 400, body: {error: '검색어를 입력하세요.'}};
  const results = formatResults(searchContent(query, data));
  return {status: 200, body: {count: results.length, results}};
}
