import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateSubmission} from '../docs/assets/core.mjs';
import {root,config,localDir,lessons,readJson,writeJson,saveSubmission,listIssues,comments,saveMaterial} from './runtime.mjs';
import {runOnce,startWorker} from './worker.mjs';
export async function createCompanion({port=config.port,backend={saveSubmission,listIssues,comments,saveMaterial},startReview=true}={}){
  const session=randomBytes(24).toString('hex');const docs=join(root,'docs');const drafts=join(localDir,'drafts');await mkdir(drafts,{recursive:true});
  function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
  const server=createServer(async(req,res)=>{
    const expectedHost=`127.0.0.1:${server.address().port}`;if(req.headers.host!==expectedHost&&req.headers.host!==`localhost:${server.address().port}`){reply(res,403,{error:'로컬 연결만 허용합니다.'});return;}
    const url=new URL(req.url,`http://${expectedHost}`);
    try{
      if(url.pathname==='/api/status'&&req.method==='GET'){reply(res,200,{companion:true,provider:config.provider,session,state:readJson(join(localDir,'worker-state.json'),{jobs:{}})});return;}
      if(url.pathname.startsWith('/api/')){
        if(req.method!=='POST'){reply(res,405,{error:'POST 요청이 필요합니다.'});return;}
        if(req.headers['x-muse-session']!==session||!String(req.headers['content-type']).startsWith('application/json')){reply(res,403,{error:'PC 학습 화면에서 다시 시도하세요.'});return;}
        if(req.headers.origin&&!([`http://${expectedHost}`,`http://localhost:${server.address().port}`].includes(req.headers.origin))){reply(res,403,{error:'다른 사이트의 실행 요청은 허용하지 않습니다.'});return;}
        let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>60000){reply(res,413,{error:'학습 기록이 너무 큽니다.'});return;}}
        const data=JSON.parse(body||'{}');
        if(url.pathname==='/api/drafts'){const p=validateSubmission(data,lessons);writeJson(join(drafts,p.submissionId+'.json'),p);reply(res,200,{saved:true});return;}
        if(url.pathname==='/api/complete'){if(!/^[a-f0-9-]{36}$/.test(data.submissionId||''))throw new Error('학습 기록 ID를 확인하세요.');const p=readJson(join(drafts,data.submissionId+'.json'),null);if(!p)throw new Error('답변 초안을 먼저 저장하세요.');const result=await backend.saveSubmission(p);reply(res,200,result);if(startReview)void runOnce();return;}
        if(url.pathname==='/api/history'){reply(res,200,{issues:await backend.listIssues()});return;}
        if(url.pathname==='/api/comments'){reply(res,200,await backend.comments(data.number));return;}
        if(url.pathname==='/api/materials'){reply(res,200,await backend.saveMaterial(data));return;}
        reply(res,404,{error:'요청 경로가 없습니다.'});return;
      }
      if(req.method!=='GET'&&req.method!=='HEAD'){reply(res,405,{error:'읽기 요청만 가능합니다.'});return;}
      const path=resolve(docs,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(docs+sep)){reply(res,403,{error:'접근할 수 없는 파일입니다.'});return;}
      const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};const content=await readFile(path);res.writeHead(200,{'Content-Type':(types[extname(path)]||'text/plain')+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
    }catch(e){if(e.code==='ENOENT')reply(res,404,{error:'파일을 찾을 수 없습니다.'});else reply(res,400,{error:e instanceof SyntaxError?'요청 형식을 확인하세요.':e.message});}
  });
  await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});if(startReview)startWorker();return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=await createCompanion();console.log(`Muse PC 학습 화면: http://127.0.0.1:${server.address().port}`);console.log(`리뷰 도구: ${config.provider} CLI · 프로그램을 켜 둔 동안 새 학습 기록을 확인합니다.`);}
