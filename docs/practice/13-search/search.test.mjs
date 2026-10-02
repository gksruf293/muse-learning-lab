import {test} from 'node:test';
import assert from 'node:assert/strict';
import {search, runSearchTool} from './search.mjs';

test('기본 설정으로 SQL 자료 두 개를 찾는다', () => {
  assert.deepEqual(search('SQL').map(d => d.id), ['sql-where', 'sql-limit']);
});
test('limit=1이면 검색 결과를 하나만 반환한다', () => {
  assert.equal(search('SQL', 1).length, 1);
});
test('오류와 정상 검색 결과 없음은 구별한다', () => {
  assert.equal(runSearchTool('SQL', 0).kind, 'error');
  assert.equal(runSearchTool('찾을 수 없는 단어', 5).kind, 'empty');
});
test('잘못된 limit와 빈 검색어를 거절한다', () => {
  for (const limit of [-1, 1.5, '2']) assert.throws(() => search('SQL', limit), RangeError);
  assert.throws(() => search('   ', 5), TypeError);
});
