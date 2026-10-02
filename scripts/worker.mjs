import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {existsSync,unlinkSync,openSync,closeSync,readFileSync,writeFileSync} from 'node:fs';
import {parseIssue} from '../docs/assets/core.mjs';
import {config,publicConfig,lessons,localDir,assertOwner,listIssues,comments,postComment,generateReview,readJson,writeJson,fingerprint} from './runtime.mjs';
const statePath=join(localDir,'worker-state.json');let busy=false;
export async function runOnce({issueList=listIssues,getComments=comments,review=generateReview,publish=postComment,ownerCheck=assertOwner,stateFile=statePath}={}){
  if(busy)return;busy=true;const state=readJson(stateFile,{jobs:{}});state.jobs??={};
  try{await ownerCheck();const issues=await issueList();state.lastPoll=new Date().toISOString();state.error=null;
    for(const issue of issues.slice().reverse()){
      if(issue.author?.login!==publicConfig.owner)continue;let submission;try{submission=parseIssue(issue.body,lessons);}catch{continue;}
      const lesson=lessons.find(l=>l.id===submission.lessonId);const hash=fingerprint(lesson,submission);const marker=`<!-- muse-review:${hash} -->`;const key=String(issue.number);let job=state.jobs[key];
      if(!job||job.hash!==hash)job=state.jobs[key]={hash,status:'queued',attempts:0};
      if(job.status==='done'||(job.retryAt&&Date.now()<job.retryAt))continue;
      try{
        const previous=await getComments(issue.number);if(previous.some(c=>(c.author?.login||c.user?.login)===publicConfig.owner&&c.body.includes(marker))){job.status='done';writeJson(stateFile,state);continue;}
        job.status='reviewing';job.startedAt=new Date().toISOString();writeJson(stateFile,state);
        if(!job.review){job.review=await review(lesson,submission);job.generatedAt=new Date().toISOString();writeJson(stateFile,state);}
        job.status='publishing';writeJson(stateFile,state);
        await publish(issue.number,`${marker}\n\n## 학습 리뷰 · ${config.provider} CLI\n\n${job.review}\n\n---\n작성: ${job.generatedAt} · 제공된 학습 문서·답변 기준의 AI 피드백입니다.`);
        job.status='done';job.finishedAt=new Date().toISOString();delete job.review;delete job.error;delete job.retryAt;console.log(`학습 #${issue.number}: 리뷰 저장 완료`);
      }catch(e){job.status='failed';job.attempts++;job.error=e.message;job.retryAt=Date.now()+Math.min(60,5*job.attempts)*60000;console.log(`학습 #${issue.number}: 리뷰 대기 (${e.message})`);}
      writeJson(stateFile,state);
    }
  }catch(e){state.error=e.message;console.log(`GitHub 연결 확인 필요: ${e.message}`);}finally{writeJson(stateFile,state);busy=false;}
  return state;
}
export function startWorker(){
  const lock=join(localDir,'worker.lock');if(existsSync(lock)){const pid=Number(readFileSync(lock,'utf8'));let alive=false;try{process.kill(pid,0);alive=true;}catch{}if(alive)throw new Error('이 저장소의 PC 리뷰 프로그램이 이미 실행 중입니다.');unlinkSync(lock);}
  const fd=openSync(lock,'wx');writeFileSync(fd,String(process.pid));closeSync(fd);process.on('exit',()=>{try{unlinkSync(lock);}catch{}});
  void runOnce();const timer=setInterval(()=>void runOnce(),Math.max(30,Number(config.pollSeconds)||60)*1000);return ()=>clearInterval(timer);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv.includes('--once'))await runOnce();else startWorker();}
