import {test} from 'node:test';
import assert from 'node:assert/strict';
import {queryRoute} from './app.mjs';

test('검색 성공의 상태·개수·표시 문구를 유지한다', () => {
  assert.deepEqual(queryRoute({query: ' SQL '}), {
    status: 200, body: {count: 1, results: [{id: 'sql', label: 'SQL 학습: 조건에 맞는 행을 선택한다.'}]}
  });
});
test('결과 없음은 정상 응답이다', () => {
  assert.deepEqual(queryRoute({query: '없는 단어'}), {status: 200, body: {count: 0, results: []}});
});
test('빈 검색어는 입력 오류다', () => {
  for (const query of ['', '  ', undefined, 123]) {
    assert.deepEqual(queryRoute({query}), {status: 400, body: {error: '검색어를 입력하세요.'}});
  }
});
