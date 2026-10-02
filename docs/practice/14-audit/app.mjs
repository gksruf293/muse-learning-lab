export const rows = [
  {id: 'sql', title: 'SQL 학습', text: '조건에 맞는 행을 선택한다.'},
  {id: 'http', title: 'HTTP 학습', text: '요청과 응답을 구분한다.'}
];

// 관찰할 점: 입력 검증, 검색, 표시용 조립, HTTP 응답이 같은 함수에 있다.
export function queryRoute(request, data = rows) {
  const query = typeof request.query === 'string' ? request.query.trim() : '';
  if (!query) return {status: 400, body: {error: '검색어를 입력하세요.'}};
  const keyword = query.toLowerCase();
  const hits = data.filter(row => `${row.title} ${row.text}`.toLowerCase().includes(keyword));
  const result = hits.map(row => ({id: row.id, label: `${row.title}: ${row.text}`}));
  return {status: 200, body: {count: result.length, results: result}};
}
