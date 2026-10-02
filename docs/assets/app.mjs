import {koreaDate,validateSubmission,issueBody,parseIssue,issueLink,reviewPrompt,materialLink,materialBody} from './core.mjs?v=20261002e';
import {filterLessons,validationErrors} from './ui.mjs?v=20261002e';
const $ = s => document.querySelector(s);
function node(tag,text,attrs={}) {const e=document.createElement(tag); if(text!==undefined)e.textContent=text; for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); return e;}
function link(text,url,attrs={}){return node('a',text,{href:url,target:'_blank',rel:'noopener',...attrs});}
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('현재 기기 저장 공간을 사용할 수 없습니다. 기록을 다운로드해 주세요.');return false;}}
let toastTimer;
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),5000);}
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=node('a',undefined,{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copy(text,fallbackName='review-prompt.txt'){try{await navigator.clipboard.writeText(text);toast('복사했습니다.');}catch{download(fallbackName,text);toast('복사를 사용할 수 없어 파일로 저장했습니다.');}}
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const timeText=iso=>new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso));
const [config, lessons] = await Promise.all(['config','lessons'].map(async n=>{const r=await fetch(`./data/${n}.json`);if(!r.ok)throw new Error('학습 자료를 불러오지 못했습니다.');return r.json();})).catch(e=>{$('#connection').textContent=e.message;throw e;});
let companion=null,historyPage=1,historyBusy=false,materials=load('muse.materials',[]);
function mergePublicMaterials(issues){
  for(const issue of issues){if((issue.author?.login||issue.user?.login)!==config.owner)continue;const match=String(issue.body||'').match(/<!-- muse-material\n([^\n]*?)\n-->\s*$/);if(!match)continue;try{const m=JSON.parse(match[1]);if(typeof m.title!=='string'||typeof m.notes!=='string'||new URL(m.url).protocol!=='https:')continue;const old=materials.findIndex(x=>x.url===m.url);m.githubUrl=issue.html_url||issue.url;if(old>=0)materials[old]=m;else materials.push(m);}catch{}}
  save('muse.materials',materials);renderMaterials();
}
try{const r=await fetch('/api/status',{signal:AbortSignal.timeout(1500)});if(r.ok){const s=await r.json();if(s.companion===true)companion=s;}}catch{}
$('#repo-link').href=`https://github.com/${config.repo}`;
$('#lesson-file-link').href=`https://github.com/${config.repo}/edit/main/docs/data/lessons.json`;

// 연결 상태: 어떤 저장 방식이 쓰이는지만 알려 줍니다.
const connection=$('#connection');
if(companion){connection.dataset.mode='pc';connection.replaceChildren(node('strong','PC 연결됨'),node('span',` · 리뷰 도구 ${companion.provider} CLI · 완료하면 GitHub CLI가 바로 공개 저장하고, 리뷰는 이 프로그램이 켜져 있는 동안 순서대로 작성됩니다.`));}
else{connection.dataset.mode='public';connection.replaceChildren(node('strong','공개 학습 화면'),node('span',' · 완료하면 GitHub 화면에서 최종 저장을 한 번 더 눌러야 기록됩니다. 리뷰는 PC 연결 프로그램이 켜져 있을 때 작성됩니다. '),link('PC용 화면 열기 ↗',config.companionUrl),node('span',' · '),node('a','연결 안내',{href:'./guide.html'}));}
if(new URLSearchParams(location.search).has('verification'))connection.append(node('p','연결 검수 모드: 아래 예시 답변은 실제 사용자 학습 기록이 아닙니다.',{class:'demo'}));

let currentId=lessons.find(l=>location.hash===`#lesson=${l.id}`)?.id || load('muse.lastLesson',lessons[0].id);

function chooseLesson(id){
  if(id===currentId)return;
  history.pushState({lessonId:id},'',`#lesson=${id}`);renderLesson(id);
  $('#lesson-panel').scrollIntoView({behavior:'instant',block:'start'});
}
function renderLessonList(){
  const query=$('#lesson-search').value,found=filterLessons(lessons,query);
  const focusedId=document.activeElement?.dataset.lesson;
  $('#lesson-search-status').textContent=query.trim()?`${found.length}개 검색 결과 · 전체 ${lessons.length}개`:`전체 ${lessons.length}개 · 각 60분`;
  $('#clear-search').hidden=!query;$('#lesson-search-empty').hidden=found.length>0;
  $('#lesson-list').replaceChildren(...found.map(l=>{const b=node('button',undefined,{type:'button',class:`lesson-button ${l.id===currentId?'active':''}`,'data-lesson':l.id,'aria-pressed':String(l.id===currentId)});b.append(node('small',l.tag),node('span',l.title));b.onclick=()=>chooseLesson(l.id);return b;}));
  const picker=$('#lesson-select');picker.replaceChildren();
  if(!found.some(l=>l.id===currentId)){const current=lessons.find(l=>l.id===currentId);picker.append(node('option',`현재 · ${current?.title} (검색 결과 밖)`,{value:currentId,disabled:''}));}
  picker.append(...found.map(l=>node('option',`${l.tag} · ${l.title}`,{value:l.id})));picker.value=currentId;
  if(focusedId){const button=Array.from($('#lesson-list').children).find(b=>b.dataset.lesson===focusedId);button?.focus({preventScroll:true});}
}
$('#lesson-search').oninput=renderLessonList;
$('#clear-search').onclick=()=>{$('#lesson-search').value='';renderLessonList();$('#lesson-search').focus();};
$('#lesson-select').onchange=e=>chooseLesson(e.target.value);
addEventListener('popstate',e=>{const id=lessons.find(l=>location.hash===`#lesson=${l.id}`)?.id||e.state?.lessonId;if(lessons.some(l=>l.id===id)&&id!==currentId){renderLesson(id);$('#lesson-panel').scrollIntoView({behavior:'instant',block:'start'});}});

// 오류는 해당 입력 옆에 남기고, 제출 실패 때만 요약으로 포커스를 옮깁니다.
function formFeedback(form,fields){
  form.noValidate=true;let checked=false;
  const summary=node('div',undefined,{class:'error-summary',tabindex:'-1','aria-labelledby':`${fields[0].id}-errors-title`,hidden:''});
  form.prepend(summary);
  for(const field of fields){field.error=node('p','',{id:`${field.id}-error`,class:'field-error',hidden:''});field.element.insertAdjacentElement('afterend',field.error);field.hint=field.element.getAttribute('aria-describedby')||'';}
  function update(focus=false){
    const errors=validationErrors(fields.map(f=>({...f,value:f.element.value})));summary.replaceChildren();summary.hidden=!errors.length;
    for(const field of fields){const error=errors.find(e=>e.id===field.id);field.error.hidden=!error;field.error.textContent=error?.message||'';if(error)field.element.setAttribute('aria-invalid','true');else field.element.removeAttribute('aria-invalid');const described=[field.hint,error?field.error.id:''].filter(Boolean).join(' ');if(described)field.element.setAttribute('aria-describedby',described);else field.element.removeAttribute('aria-describedby');}
    if(errors.length){summary.append(node('h4',`${errors.length}곳을 확인해 주세요`,{id:`${fields[0].id}-errors-title`}));const list=node('ul');for(const error of errors){const a=node('a',error.message,{href:`#${error.id}`});a.onclick=e=>{e.preventDefault();const field=fields.find(f=>f.id===error.id);field.element.focus({preventScroll:true});field.element.scrollIntoView({behavior:'instant',block:'center'});};const li=node('li');li.append(a);list.append(li);}summary.append(list);if(focus){summary.focus({preventScroll:true});summary.scrollIntoView({behavior:'instant',block:'start'});}}
    return !errors.length;
  }
  form.addEventListener('input',()=>{if(checked)update();});form.addEventListener('change',()=>{if(checked)update();});
  return {validate(){checked=true;return update(true);},reset(){checked=false;summary.hidden=true;for(const f of fields){f.error.hidden=true;f.element.removeAttribute('aria-invalid');if(f.hint)f.element.setAttribute('aria-describedby',f.hint);else f.element.removeAttribute('aria-describedby');}}};
}

function stageSection(lesson,i,fallback){
  const step=lesson.plan[i];const sec=node('section',undefined,{class:'stage',id:`stage-${i+1}`,'aria-labelledby':`stage-${i+1}-title`});
  const head=node('div',undefined,{class:'stage-head'});head.append(node('span',String(i+1),{class:'stage-no','aria-hidden':'true'}),node('h3',step?.title||fallback,{id:`stage-${i+1}-title`,tabindex:'-1'}));
  if(step)head.append(node('span',`${step.minutes}분`,{class:'min'}));
  sec.append(head);if(step)sec.append(node('p',step.task,{class:'stage-task'}));return sec;
}
function codeBlock(code,label){
  const box=node('div',undefined,{class:'code-block'});const bar=node('div',undefined,{class:'code-bar'});const button=node('button','코드 복사',{type:'button',class:'quiet'});button.onclick=()=>copy(code,'practice-code.txt');
  bar.append(node('span',label),button);box.append(bar,node('pre',code,{tabindex:'0','aria-label':`${label} 코드`}));return box;
}
function growable(t){if(CSS.supports?.('field-sizing','content'))return;const grow=()=>{const y=scrollY;t.style.height='auto';t.style.height=`${t.scrollHeight+2}px`;scrollTo(scrollX,y);};t.addEventListener('input',grow);return grow;}

function renderLesson(id){
  const lesson=lessons.find(l=>l.id===id)||lessons[0];currentId=lesson.id;save('muse.lastLesson',currentId);
  renderLessonList();
  const panel=$('#lesson-panel');

  // 머리: 목표와 60분 계획
  const head=node('header',undefined,{class:'lesson-head'});head.append(node('p',lesson.tag,{class:'eyebrow'}),node('h2',lesson.title),node('p',lesson.goal,{class:'goal'}));
  const meta=node('ul',undefined,{class:'meta'});meta.append(node('li',`예상 ${lesson.minutes}분`),node('li',`원문 검토 ${lesson.prepared.date}`),node('li',lesson.prepared.by));head.append(meta);
  const steps=node('ol',undefined,{class:'steps','aria-label':'60분 학습 단계'});
  lesson.plan.forEach((step,i)=>{const target=`stage-${Math.min(i,3)+1}`;const a=node('a',undefined,{href:`#${target}`});a.append(node('span',`${step.minutes}분`,{class:'min'}),node('b',`${i+1}. ${step.title}`));a.onclick=e=>{e.preventDefault();const h=document.getElementById(`${target}-title`);h.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});h.focus({preventScroll:true});};const li=node('li');li.append(a);steps.append(li);});
  head.append(steps);

  // 1. 목표를 먼저 확인하고, 개념 설명은 20분 읽기 단계에서 봅니다.
  const s1=stageSection(lesson,0,'목표 확인');s1.append(node('p','먼저 오늘의 목표와 위 과제를 내 말로 설명해 보세요. 이어 원문과 핵심 설명을 읽고, 실습 코드를 실행한 뒤 세 질문에 답합니다.',{class:'start-note'}));
  // 2. 원문 읽기
  const s2=stageSection(lesson,1,'원문 읽기');const sources=node('ul',undefined,{class:'sources'});
  for(const source of lesson.sources){const li=node('li',undefined,{class:'source'});li.append(link(`${source.title} ↗`,source.url),node('span',source.sections,{class:'sections'}),node('p',source.reading));sources.append(li);}
  s2.append(sources,node('p',`${lesson.prepared.by} · ${lesson.prepared.date} · ${lesson.prepared.scope}. ${lesson.prepared.note}`,{class:'prepared'}));
  const prose=node('div',undefined,{class:'prose'});for(const ch of lesson.chapters)prose.append(node('h4',ch.title),node('p',ch.text));s2.append(prose);
  // 3. 직접 해 보기
  const s3=stageSection(lesson,2,'직접 실행');const practice=node('ol',undefined,{class:'exercise'});for(const item of lesson.exercise)practice.append(node('li',item));s3.append(codeBlock(lesson.code,'실습 코드'),practice);
  // 4. 이해 확인: 답변 작성
  const s4=stageSection(lesson,3,'이해 확인');
  const form=node('form',undefined,{class:'desk','aria-labelledby':'stage-4-title'});
  form.append(node('p','문서를 닫고 내 말로 답하세요. 모르면 어디까지 이해했는지 적어도 괜찮습니다. 실제로 실행한 것과 예상한 것을 구분해 주세요.',{class:'desk-intro'}));
  const dateLabel=node('label','학습 날짜 · 한국시간 (필수)',{class:'field-date'});const date=node('input',undefined,{id:'answer-date',type:'date',required:'',value:koreaDate(),name:'date'});dateLabel.append(date);form.append(dateLabel);
  const inputs={},growers=[];
  function counter(t,el,max){const update=()=>{el.textContent=`${t.value.length.toLocaleString('ko-KR')} / ${max.toLocaleString('ko-KR')}자`;el.classList.toggle('near',t.value.length>max*0.9);};t.addEventListener('input',update);return update;}
  const counters=[];
  lesson.questions.forEach((q,i)=>{
    const wrap=node('div',undefined,{class:'question'});const fid=`answer-${q.id}`;const label=node('label',undefined,{class:'question-label',for:fid});label.append(node('span',`Q${i+1}`,{class:'qno'}),node('span',`${q.prompt} (필수)`));
    const t=node('textarea',undefined,{id:fid,rows:'5',maxlength:'3000',required:'',name:q.id,class:'answer-field','aria-describedby':`${fid}-hint`});inputs[q.id]=t;
    const foot=node('div',undefined,{class:'question-foot'});const count=node('span','',{class:'count','aria-hidden':'true'});foot.append(node('span',q.hint,{id:`${fid}-hint`}),count);
    counters.push(counter(t,count,3000));growers.push(growable(t));wrap.append(label,t,foot);form.append(wrap);
  });
  const notesWrap=node('div',undefined,{class:'question'});const notesLabel=node('label',undefined,{class:'question-label',for:'answer-notes'});notesLabel.append(node('span','메모',{class:'qno'}),node('span','실습 결과·남은 질문 (선택)'));
  const notes=node('textarea',undefined,{id:'answer-notes',rows:'4',maxlength:'4000',name:'notes',class:'answer-field',placeholder:'실행한 코드·결과, 어려웠던 부분, 다음에 다시 볼 질문을 남기세요.'});
  const notesFoot=node('div',undefined,{class:'question-foot'});const notesCount=node('span','',{class:'count','aria-hidden':'true'});notesFoot.append(node('span','실제로 실행한 결과가 있으면 함께 적어 두세요.'),notesCount);counters.push(counter(notes,notesCount,4000));growers.push(growable(notes));
  notesWrap.append(notesLabel,notes,notesFoot);form.append(notesWrap);

  // 완료 막대와 저장 단계
  const bar=node('div',undefined,{class:'submit-bar'});const draftStatus=node('div','',{class:'draft-status',role:'status'});const done=node('button','그날의 학습 완료',{type:'submit'});bar.append(draftStatus,done);form.append(bar);
  const track=node('ol',undefined,{class:'track','aria-label':'저장 단계'});const trackItems=['기기 초안','GitHub 공개 저장','PC CLI 리뷰'].map(title=>{const li=node('li');li.append(node('b',title),node('span','',{class:'state'}),node('span',''));track.append(li);return li;});
  function setTrack(i,state,label,detail=''){const li=trackItems[i];li.dataset.state=state;li.children[1].textContent=label;li.children[2].textContent=detail;}
  function resetTrack(){
    setTrack(1,'todo','아직 저장 전',companion?'완료하면 GitHub CLI가 바로 저장합니다.':'완료 후 GitHub 화면에서 최종 저장합니다.');
    setTrack(2,'todo','저장 후 시작','PC 연결 프로그램이 켜져 있을 때 작성됩니다.');
  }
  const outcome=node('div','',{class:'outcome',role:'status'});form.append(track,outcome);
  let submissionId,completed=false;const draftKey=()=>`muse.draft.${lesson.id}.${date.value}`;
  function showDraft(state,text){draftStatus.dataset.state=state;draftStatus.textContent=text;}
  function restore(){
    const d=load(draftKey(),{});for(const q of lesson.questions)inputs[q.id].value=d.answers?.[q.id]||'';notes.value=d.notes||'';submissionId=d.submissionId||crypto.randomUUID();completed=false;
    counters.forEach(f=>f());growers.forEach(f=>f?.());outcome.replaceChildren();resetTrack();
    if(d.savedAt){showDraft('saved',`이 날짜의 초안을 불러왔습니다 · ${timeText(d.savedAt)} 저장`);setTrack(0,'draft','이 기기에 있음','다른 기기와 동기화되지 않습니다.');}
    else{showDraft('empty','아직 작성한 답변이 없습니다.');setTrack(0,'todo','작성 전','입력하면 이 기기에 자동 저장됩니다.');}
  }
  function payload(){return {schema:1,submissionId,date:date.value,lessonId:lesson.id,lessonVersion:lesson.version,answers:Object.fromEntries(lesson.questions.map(q=>[q.id,inputs[q.id].value])),notes:notes.value,visibility:'public'};}
  form.oninput=e=>{if(e.target===date)return;const savedAt=new Date().toISOString();const ok=save(draftKey(),{...payload(),savedAt});
    if(ok){showDraft('saved',`이 기기에 초안 저장 · ${timeText(savedAt)} · GitHub에는 완료 시 저장`);setTrack(0,'draft','이 기기에 있음','다른 기기와 동기화되지 않습니다.');}
    else{showDraft('error','기기 저장 실패 · 아래 답변 다운로드로 보관하세요.');setTrack(0,'fail','저장 실패','답변 다운로드로 보관하세요.');}
    if(completed){completed=false;setTrack(1,'todo','답변 수정됨','다시 완료해야 GitHub 기록에 반영됩니다.');setTrack(2,'todo','새 리뷰 필요','답변이 바뀌면 이전 리뷰는 이 답변의 리뷰가 아닙니다.');}
  };
  const feedback=formFeedback(form,[{id:date.id,label:'학습 날짜',element:date,required:true,type:'date'},...lesson.questions.map((q,i)=>({id:inputs[q.id].id,label:`Q${i+1} 답변`,element:inputs[q.id],required:true,max:3000})),{id:notes.id,label:'메모',element:notes,max:4000}]);
  date.onchange=()=>{restore();feedback.reset();};restore();

  const more=node('div',undefined,{class:'more-actions'});more.append(node('p','다른 보관 방법 · 즉시 리뷰가 필요하면 수동 리뷰 프롬프트를 AI 대화에 붙여 넣을 수 있습니다.'));
  const actions=node('div',undefined,{class:'actions'});const exportButton=node('button','답변 다운로드',{type:'button',class:'secondary'});exportButton.onclick=()=>download(`${date.value}-${lesson.id}.json`,JSON.stringify(payload(),null,2),'application/json');
  const manual=node('button','수동 리뷰 프롬프트',{type:'button',class:'secondary'});manual.onclick=()=>copy(reviewPrompt(lesson,payload()));
  const newAttempt=node('button','새 답변 작성',{type:'button',class:'secondary'});newAttempt.onclick=()=>{if(Object.values(inputs).some(t=>t.value.trim())||notes.value.trim())download(`${date.value}-${lesson.id}-previous.json`,JSON.stringify(payload(),null,2),'application/json');submissionId=crypto.randomUUID();completed=false;for(const t of Object.values(inputs))t.value='';notes.value='';counters.forEach(f=>f());growers.forEach(f=>f?.());save(draftKey(),{...payload(),savedAt:new Date().toISOString()});showDraft('saved','새 답변을 작성할 수 있습니다. 이전 답변은 다운로드로 보관했습니다.');outcome.replaceChildren();resetTrack();setTrack(0,'draft','새 초안','이전 답변은 다운로드 파일로 보관했습니다.');};
  newAttempt.addEventListener('click',()=>feedback.reset());actions.append(exportButton,manual,newAttempt);more.append(actions);form.append(more);

  const solutions=node('details',undefined,{class:'fold rubric'});solutions.append(node('summary','답변 작성 후 점검 기준 보기'),node('p','답변을 쓰기 전에 열면 스스로 떠올리는 연습이 약해집니다.',{class:'muted'}));for(const q of lesson.questions)solutions.append(node('h4',q.prompt),node('p',q.rubric));form.append(solutions);

  form.onsubmit=async e=>{e.preventDefault();if(!feedback.validate())return;done.disabled=true;outcome.replaceChildren();
    let p;try{p=validateSubmission(payload(),lessons);}catch(error){outcome.append(node('p',`${error.message} · 초안은 현재 기기에 남아 있습니다.`,{class:'callout error'}));done.disabled=false;return;}
    save(draftKey(),{...p,savedAt:new Date().toISOString()});
    try{
      if(companion){
        setTrack(1,'wait','저장 중…','GitHub CLI로 공개 Issue를 저장하고 있습니다.');
        await localPost('/api/drafts',p);const r=await localPost('/api/complete',{submissionId:p.submissionId});completed=true;
        setTrack(1,'done','공개 저장됨','다른 기기에서도 학습 기록으로 볼 수 있습니다.');setTrack(2,'wait','리뷰 대기','PC CLI가 순서대로 작성합니다. 학습 기록에서 확인하세요.');
        const box=node('div',undefined,{class:'callout'});box.append(node('p','GitHub에 답변을 공개 저장했습니다. 리뷰는 PC가 켜져 있고 CLI를 사용할 수 있을 때 작성됩니다. PC가 꺼지거나 CLI 로그인이 만료되거나 사용 한도에 도달하면 늦어집니다.'),link('저장한 기록 보기 ↗',r.url,{class:'button secondary'}));outcome.append(box);
        await refreshHistory();
      }else{
        const url=issueLink(config.repo,p,lesson);const box=node('div',undefined,{class:'callout'});completed=true;
        setTrack(1,'action','GitHub에서 최종 저장 필요','아직 저장되지 않았습니다. GitHub 화면의 생성 버튼을 눌러야 기록됩니다.');setTrack(2,'todo','저장 후 대기','GitHub 저장 뒤 PC 연결 프로그램이 켜져 있을 때 작성됩니다.');
        if(url.length<=7500){box.append(node('p','아직 GitHub에 저장되지 않았습니다. 아래 버튼으로 미리 채운 학습 기록을 열고, 내용을 확인한 뒤 GitHub 화면의 생성(Create) 버튼을 눌러야 공개 기록이 됩니다.'),link('GitHub에서 공개 저장하기 ↗',url,{class:'button'}));}
        else{const name=`${p.date}-${lesson.id}-github.md`;const body=issueBody(p,lesson);download(name,body);
          const steps=node('ol');steps.append(node('li',`답변이 길어 링크에 담을 수 없어 ${name} 파일로 내려받았습니다.`),node('li','아래 버튼으로 GitHub 새 학습 기록 화면을 엽니다.'),node('li','파일 내용 전체를 본문에 붙여 넣고 GitHub 화면의 생성(Create) 버튼을 누릅니다. 파일 끝의 muse-submission 주석까지 그대로 두어야 리뷰가 연결됩니다.'));
          const again=node('button','파일 다시 내려받기',{type:'button',class:'secondary'});again.onclick=()=>download(name,body);const row=node('div',undefined,{class:'actions'});row.append(link('새 학습 기록 열기 ↗',`https://github.com/${config.repo}/issues/new?title=${encodeURIComponent(`[학습] ${p.date} ${lesson.title}`)}`,{class:'button'}),again);
          box.append(node('p','아직 GitHub에 저장되지 않았습니다.'),steps,row);}
        outcome.append(box);
      }
    }catch(error){setTrack(1,'fail','저장 실패','초안은 현재 기기에 남아 있습니다.');outcome.append(node('p',`${error.message} · 초안은 현재 기기에 남아 있습니다.`,{class:'callout error'}));}
    finally{done.disabled=false;}
  };
  s4.append(form);
  panel.replaceChildren(head,s1,s2,s3,s4);
}
async function localPost(path,payload){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Muse-Session':companion.session},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error||'PC 연결 요청에 실패했습니다.');return data;}
async function ghRead(path){const r=await fetch(`https://api.github.com/repos/${config.repo}/${path}`,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(r.status===403||r.status===429?'GitHub 조회 한도에 도달했습니다. 잠시 뒤 다시 조회하거나 저장소에서 기록을 확인하세요.':`GitHub 기록을 불러오지 못했습니다 (${r.status}).`);return r.json();}
async function fingerprint(lesson,p){const bytes=new TextEncoder().encode(JSON.stringify({lesson,submission:p}));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');}

// 리뷰 Markdown을 DOM 노드로만 만듭니다. innerHTML을 쓰지 않으므로 댓글 내용이 HTML로 실행되지 않습니다.
function inline(parent,text){for(const part of text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/)){if(!part)continue;if(part.startsWith('`')&&part.endsWith('`')&&part.length>1)parent.append(node('code',part.slice(1,-1)));else if(part.startsWith('**')&&part.endsWith('**')&&part.length>4)parent.append(node('strong',part.slice(2,-2)));else parent.append(document.createTextNode(part));}return parent;}
function renderMarkdown(text){
  const out=document.createDocumentFragment();const lines=text.replace(/\r\n/g,'\n').split('\n');let para=[],list=null;
  const flush=()=>{if(para.length){out.append(inline(node('p'),para.join('\n')));para=[];}list=null;};
  for(let i=0;i<lines.length;i++){const line=lines[i];
    if(/^\s*```/.test(line)){flush();const code=[];while(++i<lines.length&&!/^\s*```/.test(lines[i]))code.push(lines[i]);out.append(node('pre',code.join('\n'),{tabindex:'0'}));continue;}
    const h=line.match(/^(#{1,6})\s+(.*)$/);if(h){flush();out.append(inline(node(h[1].length<=3?'h5':'h6'),h[2]));continue;}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(line)){flush();out.append(node('hr'));continue;}
    const item=line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/);if(item){if(para.length){out.append(inline(node('p'),para.join('\n')));para=[];}const tag=item[1]?'ul':'ol';if(!list||list.tagName.toLowerCase()!==tag){list=node(tag);out.append(list);}list.append(inline(node('li'),item[3]));continue;}
    if(!line.trim()){flush();continue;}
    if(list&&/^\s{2,}\S/.test(line)){list.lastChild.append(document.createTextNode(' '+line.trim()));continue;}
    list=null;para.push(line.replace(/^>\s?/,''));
  }
  flush();return out;
}
const reviewChip={none:'펼쳐서 리뷰 확인',done:'리뷰 완료',wait:'리뷰 대기',busy:'리뷰 작성 중',fail:'리뷰 실패 · 재시도 예정',error:'확인 실패'};
function setChip(chip,state){chip.dataset.state={none:'',busy:'wait',error:'fail'}[state]??state;chip.textContent=reviewChip[state];}
async function showIssue(issue,jobs){
  if(issue.title?.startsWith('[연결 검수]')&&!new URLSearchParams(location.search).has('verification'))return;
  let p;try{p=parseIssue(issue.body,lessons);}catch{return;}
  const l=lessons.find(x=>x.id===p.lessonId);const hash=await fingerprint(l,p);const job=jobs?.[String(issue.number)];const jobState=job&&job.hash===hash?job.status:null;
  const card=node('details',undefined,{class:'journal'});const summary=node('summary');const title=node('span',undefined,{class:'title'});title.append(node('small',l.tag),document.createTextNode(l.title));
  const chip=node('span','',{class:'chip'});setChip(chip,jobState==='failed'?'fail':['queued','reviewing','publishing'].includes(jobState)?(jobState==='queued'?'wait':'busy'):'none');
  summary.append(node('span',p.date,{class:'date'}),title,chip);
  const body=node('div',undefined,{class:'journal-body'});body.append(link('GitHub 원본 ↗',issue.html_url||issue.url,{class:'origin'}));
  for(const [i,q] of l.questions.entries()){const qa=node('div',undefined,{class:'qa'});qa.append(node('p',`Q${i+1}. ${q.prompt}`,{class:'q'}),node('div',p.answers[q.id],{class:'response'}));body.append(qa);}
  if(p.notes){const qa=node('div',undefined,{class:'qa'});qa.append(node('p','실습 결과·남은 질문',{class:'q'}),node('div',p.notes,{class:'response'}));body.append(qa);}
  const review=node('section',undefined,{class:'review'});const reviewBox=node('div','기록을 열면 리뷰를 확인합니다.',{class:'review-body'});review.append(node('h4','AI 리뷰'),reviewBox);body.append(review);
  card.append(summary,body);
  let loaded=false;card.addEventListener('toggle',async()=>{if(!card.open||loaded)return;reviewBox.textContent='리뷰를 확인하고 있습니다…';try{const comments=companion?await localPost('/api/comments',{number:issue.number}):await ghRead(`issues/${issue.number}/comments?per_page=100`);const marker=`<!-- muse-review:${hash} -->`;const found=comments.filter(c=>(c.user?.login||c.author?.login)===config.owner&&c.body.includes(marker)).at(-1);
    if(found){reviewBox.replaceChildren(renderMarkdown(found.body.replace(marker,'').trim()));setChip(chip,'done');}
    else if(jobState==='failed'){reviewBox.replaceChildren(node('p',`PC 리뷰가 실패했습니다: ${job.error||'원인을 확인하지 못했습니다.'}`),node('p',job.retryAt?`다음 시도 예정 ${new Date(job.retryAt).toLocaleString('ko-KR')}. 답변은 GitHub에 그대로 남아 있습니다.`:'답변은 GitHub에 그대로 남아 있습니다.',{class:'review-note'}));setChip(chip,'fail');}
    else{reviewBox.replaceChildren(node('p','아직 이 답변의 리뷰가 없습니다. PC 연결 프로그램이 켜져 있고 CLI를 사용할 수 있을 때 순서대로 작성됩니다.'),node('p','PC가 꺼져 있거나 절전 중이거나, CLI 로그인이 만료됐거나 사용 한도에 도달하면 리뷰가 늦어집니다. 답변을 수정하면 새 리뷰가 필요합니다.',{class:'review-note'}));setChip(chip,jobState==='reviewing'||jobState==='publishing'?'busy':'wait');}
    loaded=true;}catch(e){reviewBox.textContent=e.message;setChip(chip,'error');}});
  $('#history-list').append(card);
}
async function refreshHistory(append=false){if(historyBusy)return;historyBusy=true;$('#refresh-history').disabled=true;const status=$('#history-status');status.textContent='GitHub 기록을 확인하고 있습니다…';if(!append){historyPage=1;$('#history-list').replaceChildren();}
  try{let issues,state=null;
    if(companion){const data=await localPost('/api/history',{});issues=data.issues;$('#more-history').hidden=true;try{state=(await(await fetch('/api/status')).json()).state;}catch{}}
    else{issues=await ghRead(`issues?state=all&sort=created&direction=desc&per_page=100&page=${historyPage}`);$('#more-history').hidden=issues.length<100;}
    mergePublicMaterials(issues);const records=issues.filter(i=>!i.pull_request&&(i.user?.login||i.author?.login)===config.owner);for(const issue of records)await showIssue(issue,state?.jobs);
    if(!$('#history-list').children.length)$('#history-list').append(node('div','아직 공개 저장한 학습 기록이 없습니다. 답변을 작성하고 학습을 완료해 보세요.',{class:'empty'}));
    status.textContent='기록을 펼치면 답변과 리뷰를 함께 봅니다. '+(companion?'PC 연결 프로그램이 꺼지면 리뷰는 대기합니다.':'리뷰 작성은 PC 연결 프로그램이 담당합니다.');
    const failure=Object.values(state?.jobs||{}).find(j=>j.status==='failed');if(state?.error||failure)status.append(node('span',` 연결 확인 필요: ${state.error||failure.error}`,{class:'warn'}));
  }catch(e){status.replaceChildren(node('span',e.message+' '),link('GitHub에서 직접 보기 ↗',`https://github.com/${config.repo}/issues`));}finally{historyBusy=false;$('#refresh-history').disabled=false;}}
$('#refresh-history').onclick=()=>refreshHistory();$('#more-history').onclick=()=>{historyPage++;refreshHistory(true);};
function renderMaterials(){const box=$('#material-list');box.replaceChildren();if(!materials.length)box.append(node('p','아직 보관한 자료가 없습니다.',{class:'empty'}));
  for(const m of materials){const row=node('div',undefined,{class:'material'});row.append(link(m.title,m.url));if(m.notes)row.append(node('p',m.notes));const info=node('div',undefined,{class:'row'});
    if(m.githubUrl)info.append(node('span','GitHub 공개 저장됨',{class:'chip','data-state':'public'}),link('기록 보기 ↗',m.githubUrl));
    else{info.append(node('span','이 기기에만 보관됨',{class:'chip','data-state':'draft'}));if(!companion){try{const u=materialLink(config.repo,m);if(u.length<=7500)info.append(link('GitHub에 공개 저장하기 ↗',u));}catch{}}}
    row.append(info);box.append(row);}}
const materialFeedback=formFeedback($('#material-form'),[{id:'material-title',label:'자료 제목',element:$('#material-title'),required:true,max:150},{id:'material-url',label:'원문 링크',element:$('#material-url'),required:true,type:'https'},{id:'material-notes',label:'메모',element:$('#material-notes'),max:2000}]);
$('#material-form').onsubmit=async e=>{e.preventDefault();if(!materialFeedback.validate())return;const submit=e.target.querySelector('button');submit.disabled=true;const f=new FormData(e.target);const m={title:String(f.get('title')).trim(),url:String(f.get('url')).trim(),notes:String(f.get('notes')).trim(),date:koreaDate()};try{const url=new URL(m.url);if(url.protocol!=='https:')throw new Error('https://로 시작하는 공개 자료 링크를 입력하세요.');if(companion){const r=await localPost('/api/materials',m);m.githubUrl=r.url;}materials.unshift(m);save('muse.materials',materials);renderMaterials();e.target.reset();materialFeedback.reset();if(companion)$('#material-status').textContent='GitHub에 자료를 공개 저장했습니다.';else{const issueUrl=materialLink(config.repo,m);$('#material-status').replaceChildren(node('span','현재 기기에 보관했습니다. 아직 GitHub에는 저장되지 않았습니다. GitHub 화면에서 최종 저장해야 다른 기기에서 볼 수 있습니다. '));if(issueUrl.length<=7500)$('#material-status').append(link('GitHub에 자료 공개 저장하기 ↗',issueUrl));else{download('reading-material-github.md',materialBody(m));$('#material-status').append(node('span','긴 메모를 파일로 내려받았습니다. 새 Issue 본문에 붙여 넣으세요. '),link('자료 Issue 열기 ↗',`https://github.com/${config.repo}/issues/new?title=${encodeURIComponent(`[자료] ${m.title}`)}`));}}}catch(err){$('#material-status').textContent=err.message;}finally{submit.disabled=false;}};
$('#copy-lesson-prompt').onclick=()=>copy(`한국어로 60분 학습 문서를 만들어 주세요. 먼저 제가 지정한 무료 공개 원문의 필요한 구간을 실제로 읽으세요. 접근하지 못한 구간은 읽었다고 쓰지 말고 알려 주세요. 원문 링크·읽은 날짜·구간을 기록하고 전문 복제 대신 직접 쓴 안내와 작은 실습을 만드세요. 목표 하나, 5/20/20/15분 계획, 핵심 개념 최대 세 개, 20분 실습, 이해 확인 질문 세 개와 별도 평가 기준을 포함하세요. https://github.com/${config.repo}/blob/main/docs/data/lessons.json 의 스키마를 따라 한 개의 JSON 객체로 반환하세요. 사용자 답변을 미리 만들거나 학습 완료 사실을 지어내지 마세요.\n\n원문 링크:\n학습 목적:`);
renderLesson(currentId);history.replaceState({lessonId:currentId},'',location.href);renderMaterials();await refreshHistory();
