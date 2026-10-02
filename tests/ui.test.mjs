import test from 'node:test';
import assert from 'node:assert/strict';
import {filterLessons, validationErrors} from '../docs/assets/ui.mjs';

test('lesson search handles Korean, case, width variants and multiple words without changing lessons', () => {
  const lessons = [{id:'a',tag:'04 · FastAPI',title:'요청 본문',goal:'JSON 입력'}, {id:'b',tag:'SQL',title:'조건 검색',goal:'조회'}];
  assert.deepEqual(filterLessons(lessons, 'ＦＡＳＴＡＰＩ  요청').map(l=>l.id), ['a']);
  assert.deepEqual(filterLessons(lessons, '본문 없는단어'), []);
  assert.equal(filterLessons(lessons, '   ').length, 2);
  assert.equal(lessons.length, 2);
});

test('required whitespace answers and long drafts produce errors linked to the actual fields', () => {
  assert.deepEqual(validationErrors([{id:'q1',label:'Q1 답변',value:' \n ',required:true}, {id:'notes',label:'메모',value:'x'.repeat(4001),max:4000}]).map(e=>e.id), ['q1','notes']);
  assert.deepEqual(validationErrors([{id:'notes',label:'메모',value:'',max:4000}]), []);
});

test('date validation rejects rolled-over calendar dates and accepts leap days', () => {
  const field = value => [{id:'date',label:'학습 날짜',value,required:true,type:'date'}];
  assert.equal(validationErrors(field('2026-02-29')).length,1);
  assert.equal(validationErrors(field('2026-09-31')).length,1);
  assert.equal(validationErrors(field('2024-02-29')).length,0);
});

test('material link validation accepts public HTTPS and rejects malformed or executable URLs', () => {
  const field = value => [{id:'url',label:'원문 링크',value,required:true,type:'https'}];
  for (const value of ['javascript:alert(1)', 'http://example.com', 'https://', 'invalid']) assert.equal(validationErrors(field(value)).length,1);
  assert.deepEqual(validationErrors(field(' https://docs.python.org/3/ ')), []);
});
