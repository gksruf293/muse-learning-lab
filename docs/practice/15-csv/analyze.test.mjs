import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyze} from './analyze.mjs';

test('정상 행만 집계하고 오류 행 번호를 남긴다', () => {
  const result = analyze(readFileSync(new URL('./study.csv', import.meta.url), 'utf8'));
  assert.equal(result.validCount, 3);
  assert.equal(result.totalMinutes, 150);
  assert.equal(result.averageMinutes, 50);
  assert.equal(result.completedCount, 2);
  assert.equal(result.completionRate, 2 / 3);
  assert.deepEqual(result.errors.map(e => e.line), [5, 6, 7]);
});
test('정상 행이 없으면 평균·완료율은 null이다', () => {
  const result = analyze('date,lesson,minutes,completed\n2026-10-04,SQL,,true\n');
  assert.equal(result.validCount, 0);
  assert.equal(result.averageMinutes, null);
  assert.equal(result.completionRate, null);
});
test('같은 입력은 같은 결과를 반환하고 다른 열은 거절한다', () => {
  const csv = readFileSync(new URL('./study.csv', import.meta.url), 'utf8');
  assert.deepEqual(analyze(csv), analyze(csv));
  assert.throws(() => analyze('date,title\n2026-10-01,SQL'), /열 이름/);
});
