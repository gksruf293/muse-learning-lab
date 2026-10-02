import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {analyzeReference, queryRouteReference, searchContent} from '../docs/practice/solutions/reference.mjs';
import {queryRoute, rows} from '../docs/practice/14-audit/app.mjs';

const practiceRoot = fileURLToPath(new URL('../docs/practice/', import.meta.url));
function runFile(path) {
  const childEnv = {...process.env};
  // 자식 프로세스는 별도 테스트 실행이다. 부모 테스트 문맥을 넘기지 않는다.
  delete childEnv.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', path], {encoding: 'utf8', env: childEnv});
  assert.equal(result.error, undefined);
  return result;
}
test('13강은 기본 설정 하나만 실패하며 설정 수정 후 경계 검사까지 통과한다', () => {
  const folder = mkdtempSync(join(tmpdir(), 'muse-search-practice-'));
  cpSync(join(practiceRoot, '13-search'), folder, {recursive: true});
  const before = runFile(join(folder, 'search.test.mjs'));
  assert.equal(before.status, 1, before.stdout + before.stderr);
  assert.match(before.stdout, /# fail 1\b/);
  assert.match(before.stdout, /not ok 1 - 기본 설정/);
  writeFileSync(join(folder, 'config.mjs'), 'export const MAX_RESULTS = 5;\n');
  const after = runFile(join(folder, 'search.test.mjs'));
  assert.equal(after.status, 0, after.stdout + after.stderr);
  assert.match(after.stdout, /# pass 4\b/);
});
test('14강 참고 분리는 기존 응답을 유지하며 검색을 단독으로 검사할 수 있다', () => {
  const existing = runFile(join(practiceRoot, '14-audit', 'app.test.mjs'));
  assert.equal(existing.status, 0, existing.stdout + existing.stderr);
  assert.match(existing.stdout, /# pass 3\b/);
  for (const query of [' SQL ', '없는 단어', '', '  ', undefined, 123]) {
    assert.deepEqual(queryRouteReference({query}, rows), queryRoute({query}, rows));
  }
  const fixture = [{id: 'x', title: 'MCP', text: '도구 계약'}, {id: 'y', title: 'SQL', text: '행 선택'}];
  assert.deepEqual(searchContent('mcp', fixture), [fixture[0]]);
  assert.deepEqual(searchContent('행', fixture), [fixture[1]]);
});
test('15강 초기 오류 두 개를 재현하고 참고 구현은 같은 검사·누락·명시적 0을 통과한다', () => {
  const folder = mkdtempSync(join(tmpdir(), 'muse-csv-practice-'));
  cpSync(join(practiceRoot, '15-csv'), folder, {recursive: true});
  const before = runFile(join(folder, 'analyze.test.mjs'));
  assert.equal(before.status, 1, before.stdout + before.stderr);
  assert.match(before.stdout, /# fail 2\b/);
  writeFileSync(join(folder, 'analyze.mjs'), `export {analyzeReference as analyze} from ${JSON.stringify(new URL('../docs/practice/solutions/reference.mjs', import.meta.url).href)};\n`);
  const after = runFile(join(folder, 'analyze.test.mjs'));
  assert.equal(after.status, 0, after.stdout + after.stderr);
  const csv = readFileSync(join(practiceRoot, '15-csv', 'study.csv'), 'utf8');
  const report = analyzeReference(csv);
  assert.deepEqual(report.errors.map(e => e.reasons), [['학습 시간 누락'], ['학습 시간이 유효한 0 이상의 수가 아님'], ['완료 값이 true/false가 아님']]);
  assert.deepEqual(analyzeReference(csv), report);
  const edge = analyzeReference('date,lesson,minutes,completed\n2026-10-01,SQL,0,false\n2026-10-02,HTTP,abc,true\n');
  assert.equal(edge.validCount, 1);
  assert.equal(edge.averageMinutes, 0);
  assert.deepEqual(edge.errors.map(e => e.line), [3]);
});
