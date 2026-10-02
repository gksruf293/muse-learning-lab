import {spawn} from 'node:child_process';
import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateSubmission,parseIssue,issueBody,reviewPrompt,validateMaterial,materialBody} from '../docs/assets/core.mjs';
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const localDir=join(root,'.local');mkdirSync(localDir,{recursive:true});
export const lessons=JSON.parse(readFileSync(join(root,'docs/data/lessons.json'),'utf8'));
export const publicConfig=JSON.parse(readFileSync(join(root,'docs/data/config.json'),'utf8'));
const overrides=existsSync(join(root,'local.config.json'))?JSON.parse(readFileSync(join(root,'local.config.json'),'utf8')):{};
export const config={provider:'codex',pollSeconds:60,port:3847,repo:publicConfig.repo,...overrides};
if(config.repo!==publicConfig.repo||!['claude','codex'].includes(config.provider))throw new Error('저장소 또는 리뷰 도구 설정을 확인하세요.');
export function writeJson(path,data){writeFileSync(path+'.tmp',JSON.stringify(data,null,2),'utf8');renameSync(path+'.tmp',path);}
export function readJson(path,fallback={}){try{return JSON.parse(readFileSync(path,'utf8'));}catch{return fallback;}}
export function fingerprint(lesson,submission){return createHash('sha256').update(JSON.stringify({lesson,submission})).digest('hex');}
export function run(executable,args,{input='',cwd=root,env=process.env,timeout=120000}={}){
  return new Promise((resolveResult,reject)=>{
    const child=spawn(executable,args,{cwd,env,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',ended=false;
    const timer=setTimeout(()=>{child.kill();reject(new Error('CLI 실행 제한 시간을 넘었습니다. 답변은 보존됩니다.'));},timeout);timer.unref();
    child.on('error',e=>{clearTimeout(timer);reject(new Error(`CLI를 실행하지 못했습니다: ${e.code||'설치 확인 필요'}`));});
    child.stdout.on('data',b=>{out+=b.toString();if(out.length>2000000)child.kill();});child.stderr.on('data',b=>{err+=b.toString();if(err.length>2000000)child.kill();});
    child.on('close',code=>{clearTimeout(timer);ended=true;if(code!==0)reject(new Error(`CLI 실행 실패 (${code}). 로그인·네트워크·사용 한도를 확인하세요.`));else resolveResult(out);});
    child.stdin.on('error',()=>{});if(!ended)child.stdin.end(input);
  });
}
export function gh(args,options={}){return run(process.env.MUSE_GH_PATH||'gh',args,options);}
export async function assertOwner(){const login=(await gh(['api','user','--jq','.login'])).trim();if(login!==publicConfig.owner)throw new Error('저장소 소유자의 GitHub 계정으로 로그인하세요.');return login;}
export async function listIssues(){return JSON.parse(await gh(['issue','list','--repo',config.repo,'--state','all','--limit','1000','--json','number,title,body,url,author,createdAt,updatedAt']));}
export async function comments(number){if(!Number.isSafeInteger(number)||number<1)throw new Error('Issue 번호가 잘못됐습니다.');const data=JSON.parse(await gh(['issue','view',String(number),'--repo',config.repo,'--json','comments']));return data.comments;}
export async function postComment(number,body){const path=join(localDir,`comment-${number}.md`);writeFileSync(path,body,'utf8');return (await gh(['issue','comment',String(number),'--repo',config.repo,'--body-file',path])).trim();}
export async function saveSubmission(value){
  const submission=validateSubmission(value,lessons);await assertOwner();
  const issues=await listIssues();const previous=issues.find(i=>{if(i.author.login!==publicConfig.owner)return false;try{return parseIssue(i.body,lessons).submissionId===submission.submissionId;}catch{return false;}});
  const lesson=lessons.find(l=>l.id===submission.lessonId);const path=join(localDir,`submission-${submission.submissionId}.md`);writeFileSync(path,issueBody(submission,lesson),'utf8');
  if(previous){const old=parseIssue(previous.body,lessons);if(JSON.stringify(old)!==JSON.stringify(submission))await gh(['issue','edit',String(previous.number),'--repo',config.repo,'--body-file',path]);return {url:previous.url,number:previous.number};}
  const title=submission.notes.startsWith('[연결 검수]')?'[연결 검수] 공개 저장·PC CLI 리뷰 테스트 (실제 학습 아님)':`[학습] ${submission.date} ${lesson.title}`;
  const url=(await gh(['issue','create','--repo',config.repo,'--title',title,'--body-file',path])).trim();const number=Number(url.split('/').at(-1));if(!Number.isSafeInteger(number))throw new Error('저장 결과를 확인하지 못했습니다. GitHub Issues에서 확인하세요.');return {url,number};
}
export async function saveMaterial(material){
  material=validateMaterial(material);await assertOwner();
  const path=join(localDir,'material.md');writeFileSync(path,materialBody(material),'utf8');
  return {url:(await gh(['issue','create','--repo',config.repo,'--title',`[자료] ${material.title}`,'--body-file',path])).trim()};
}
export function parseClaudeOutput(output){const data=JSON.parse(output);if(data.is_error||data.subtype!=='success'||typeof data.result!=='string'||!data.result.trim())throw new Error('Claude가 정상 리뷰를 반환하지 않았습니다. 로그인·사용 한도를 확인하세요.');return data.result.trim();}
export function parseCodexOutput(output){const events=output.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));if(events.some(e=>e.type==='error'||e.type==='turn.failed'))throw new Error('Codex 리뷰 실행이 실패했습니다.');const final=events.filter(e=>e.type==='item.completed'&&e.item?.type==='agent_message').at(-1)?.item?.text;if(!final?.trim()||!events.some(e=>e.type==='turn.completed'))throw new Error('Codex가 완료된 리뷰를 반환하지 않았습니다.');return final.trim();}
export async function generateReview(lesson,submission){
  const prompt=reviewPrompt(lesson,submission);const cwd=join(localDir,'reviewer');mkdirSync(cwd,{recursive:true});
  const env={...process.env};for(const name of Object.keys(env))if(/^(GH_TOKEN|GITHUB_TOKEN|OPENROUTER_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY)$/.test(name))delete env[name];
  if(config.provider==='claude'){
    const output=await run(process.env.MUSE_CLAUDE_PATH||'claude',['--safe-mode','-p','--output-format','json','--tools','','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--no-session-persistence','--max-turns','1'],{cwd,input:prompt,env,timeout:300000});
    return parseClaudeOutput(output);
  }
  const command=process.env.MUSE_CODEX_PATH||'codex';const prefix=command.endsWith('.js')?[command]:[];
  const output=await run(prefix.length?process.execPath:command,[...prefix,'exec','--ignore-user-config','--sandbox','read-only','--skip-git-repo-check','--ephemeral','--json','-c','features.shell_tool=false','-c','features.apply_patch_freeform=false','-'],{cwd,input:prompt,env,timeout:300000});
  return parseCodexOutput(output);
}
