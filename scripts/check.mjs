import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,lessons} from './runtime.mjs';
const ids=new Set();
for(const l of lessons){assert(!ids.has(l.id));ids.add(l.id);assert(l.version>0);assert.equal(l.minutes,60);assert.equal(l.plan.reduce((sum,s)=>sum+s.minutes,0),60);assert(l.sources.length>0&&l.questions.length===3);assert.match(l.prepared.date,/^\d{4}-\d{2}-\d{2}$/);for(const s of l.sources)assert(new URL(s.url).protocol==='https:');for(const q of l.questions)assert(q.id&&q.prompt&&q.rubric);}
function inspect(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())inspect(path);else if(name.endsWith('.mjs')){const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}else if(name.endsWith('.json'))JSON.parse(readFileSync(path,'utf8'));}}
inspect(join(root,'docs'));inspect(join(root,'scripts'));console.log(`${lessons.length}개 학습 문서 · 60분 구성 · JSON · JavaScript 검사 통과`);
