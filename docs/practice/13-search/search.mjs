import {MAX_RESULTS} from './config.mjs';

export const documents = [
  {id: 'sql-where', text: 'SQL WHERE는 조건에 맞는 행을 고른다.'},
  {id: 'sql-limit', text: 'SQL LIMIT는 반환할 행 수를 제한한다.'},
  {id: 'http-status', text: 'HTTP 응답은 상태 코드와 본문을 포함한다.'}
];

// 벡터 검색을 대체한 단순 문자열 검색이다. DB·LLM 호출은 없다.
export function search(query, limit = MAX_RESULTS) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit는 1 이상의 정수여야 한다.');
  const keyword = query.trim().toLowerCase();
  if (!keyword) throw new TypeError('빈 검색어는 허용하지 않는다.');
  return documents.filter(d => d.text.toLowerCase().includes(keyword)).slice(0, limit);
}

export function runSearchTool(query, limit) {
  try {
    const matches = search(query, limit);
    return {kind: matches.length ? 'ok' : 'empty', documents: matches, sources: matches.map(d => d.id)};
  } catch (error) {
    return {kind: 'error', documents: [], sources: [], error: error.message};
  }
}
