const guideItems=[
{key:'problem',title:'研究問題是什麼？',en:'What research question is this paper trying to answer?',help:'不要抄 title。用一句話說：作者到底想知道什麼？為什麼值得研究？',placeholder:'The paper asks whether...'},
{key:'gap',title:'研究缺口是什麼？',en:'What is missing, weak, or unresolved in previous research?',help:'找 Introduction 最後幾段：however, few studies, remains unclear, limited evidence...',placeholder:'過去研究做了什麼？還缺什麼？'},
{key:'data',title:'資料是什麼？',en:'What data did the authors use, and where did it come from?',help:'寫出樣本、場域、期間、數量與資料來源。',placeholder:'Data source / sample size / study area / study period...'},
{key:'method',title:'方法是什麼？',en:'How did the authors turn the data into an answer?',help:'先用 Input → Process → Output 說一次，再補模型、指標或統計方法。',placeholder:'Input → Process → Output'},
{key:'finding',title:'主要發現是什麼？',en:'What are the 1–3 findings that actually matter?',help:'寫方向、大小、條件。不要只寫 significant / not significant。',placeholder:'Finding 1...\nFinding 2...\nFinding 3...'},
{key:'limitation',title:'可信嗎？限制在哪裡？',en:'What assumptions, biases, or limitations could change the conclusion?',help:'想資料偏差、測量誤差、模型假設、樣本代表性、因果與外部效度。',placeholder:'作者承認的限制 + 你看到的限制'},
{key:'myuse',title:'這篇論文對我有什麼用？',en:'How can this paper change my research, method, hypothesis, or next step?',help:'它可以當 baseline、method source、theory、dataset reference、gap，還是反例？',placeholder:'I can use...\nI should not directly copy...\nI want to test...'}];

const levels=[
{n:1,name:'Recognize｜找得到',short:'知道它在研究什麼',description:'可以定位論文的基本元素，不需要深入批判。',checks:['我能指出研究問題與研究目的','我知道資料來源與研究對象','我知道作者用了什麼主要方法','我能說出至少一個主要結果'],notePrompt:'Level 1 筆記：這篇論文最基本是在做什麼？'},
{n:2,name:'Explain｜說得出',short:'能不用看原文解釋',description:'可以用自己的話重建整篇研究邏輯。',checks:['我能不用看原文，用 1 分鐘說出 Problem → Method → Finding','我能解釋為什麼作者選這個方法','我知道主要變數／指標代表什麼','我能說明結果的方向、大小或條件，而不只是「有顯著」'],notePrompt:'Level 2 筆記：如果我要教別人，我會怎麼解釋？'},
{n:3,name:'Evaluate｜評得出',short:'能判斷它可信到哪裡',description:'開始從讀者變成審查者，知道結論在哪些條件下成立。',checks:['我能指出至少一個重要假設或限制','我能判斷資料是否足以支持作者的結論','我能指出可能的偏差、混淆因素或外部效度問題','我知道如果換場域、樣本或方法，結果可能怎麼改變'],notePrompt:'Level 3 筆記：我同意什麼？懷疑什麼？為什麼？'},
{n:4,name:'Use｜用得出',short:'能轉成自己的研究',description:'把別人的論文變成自己的研究決策。',checks:['我知道這篇可當 baseline、method source、theory、gap 或反例中的哪一種','我能說出哪些部分可以借用，哪些不能直接照搬','我能提出至少一個延伸研究問題、假設或實驗設計','我知道這篇論文會改變我下一步讀什麼或做什麼'],notePrompt:'Level 4 筆記：我要怎麼把它轉成自己的研究下一步？'}];

const DB_KEY='paperReadingGuide_library_v1';
const LEGACY_KEY='paperReadingGuide_v2';
const DARK_KEY='paperReadingGuide_dark';
const GAP_NOTE_KEY='paperReadingGuide_gap_hypothesis';
let compareIds=[];

function blankPaper(){
  const p={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()),paperTitle:'',paperAuthor:'',paperVenue:'',paperUrl:'',answers:{},checks:{},oneMinuteSummary:'',levelChecks:{},levelNotes:{},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  guideItems.forEach(x=>{p.answers[x.key]='';p.checks[x.key]=false;});
  levels.forEach(l=>{p.levelChecks[l.n]=l.checks.map(()=>false);p.levelNotes[l.n]='';});
  return p;
}
function normalizePaper(raw){
  const p={...blankPaper(),...(raw||{})};
  p.answers={...Object.fromEntries(guideItems.map(x=>[x.key,''])),...(p.answers||{})};
  p.checks={...Object.fromEntries(guideItems.map(x=>[x.key,false])),...(p.checks||{})};
  p.levelChecks=p.levelChecks||{};p.levelNotes=p.levelNotes||{};
  levels.forEach(l=>{if(!Array.isArray(p.levelChecks[l.n]))p.levelChecks[l.n]=l.checks.map(()=>false);if(typeof p.levelNotes[l.n]!=='string')p.levelNotes[l.n]='';});
  return p;
}
function loadDB(){
  let db;try{db=JSON.parse(localStorage.getItem(DB_KEY)||'null');}catch{}
  if(!db||!Array.isArray(db.papers)){
    let legacy={};try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}');}catch{}
    const hasLegacy=legacy&&(legacy.paperTitle||legacy.paperAuthor||legacy.paperVenue||legacy.paperUrl||Object.values(legacy.answers||{}).some(Boolean));
    const first=normalizePaper(hasLegacy?legacy:blankPaper());db={papers:[first],activeId:first.id};localStorage.setItem(DB_KEY,JSON.stringify(db));
  }
  db.papers=db.papers.map(normalizePaper);
  if(!db.papers.length){const p=blankPaper();db.papers=[p];db.activeId=p.id;}
  if(!db.papers.some(p=>p.id===db.activeId))db.activeId=db.papers[0].id;
  return db;
}

let db=loadDB();
let state=db.papers.find(p=>p.id===db.activeId);
let dark=localStorage.getItem(DARK_KEY)==='1';

function levelComplete(p,n){return (p.levelChecks[n]||[]).length===levels[n-1].checks.length&&(p.levelChecks[n]||[]).every(Boolean);}
function currentLevel(p=state){let achieved=0;for(const l of levels){if(levelComplete(p,l.n)&&achieved===l.n-1)achieved=l.n;else break;}return achieved;}
function formatDate(iso){try{return new Intl.DateTimeFormat('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}catch{return '';}}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

function persist(message='已自動儲存'){
  state.updatedAt=new Date().toISOString();
  const i=db.papers.findIndex(p=>p.id===state.id);if(i>=0)db.papers[i]=state;else db.papers.unshift(state);
  db.activeId=state.id;localStorage.setItem(DB_KEY,JSON.stringify(db));
  const s=document.getElementById('saveState');if(s)s.textContent=message;
  progress();renderLevelStatus();renderLibrary(document.getElementById('paperSearch')?.value||'');renderDashboard();renderCompare();renderGapInsights();
}

function progress(){const n=guideItems.filter(x=>state.checks[x.key]).length;document.getElementById('progressText').textContent=`${n} / 7`;document.getElementById('progressFill').style.width=`${n/7*100}%`;}
function renderLevelStatus(){
  const achieved=currentLevel();document.getElementById('currentLevel').textContent=`Level ${achieved}`;document.getElementById('currentLevelName').textContent=achieved?levels[achieved-1].name:'尚未建立基本理解';
  document.getElementById('levelTrack').innerHTML=levels.map(l=>{const done=l.n<=achieved,active=l.n===Math.min(achieved+1,4)&&achieved<4;return `<div class="level-step ${done?'done':''} ${active?'active':''}"><div class="level-dot">${done?'✓':l.n}</div><div><strong>Level ${l.n}</strong><span>${l.short}</span></div></div>`;}).join('');
}

function renderDashboard(){
  const total=db.papers.length;const counts=[0,0,0,0,0];db.papers.forEach(p=>counts[currentLevel(p)]++);
  const completed=db.papers.filter(p=>currentLevel(p)>=4).length;
  const cards=[['Papers',total,'已建立的論文資產'],['Level 1+',total-counts[0],'至少建立基本理解'],['Level 3+',counts[3]+counts[4],'可批判與評估'],['Level 4',completed,'可轉成研究決策']];
  document.getElementById('statsGrid').innerHTML=cards.map(x=>`<article class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('');
}

function renderLibrary(query=''){
  const q=query.trim().toLowerCase();const papers=[...db.papers].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).filter(p=>!q||[p.paperTitle,p.paperAuthor,p.paperVenue].join(' ').toLowerCase().includes(q));
  document.getElementById('libraryCount').textContent=`${db.papers.length} 篇`;
  const box=document.getElementById('paperLibrary');
  box.innerHTML=papers.length?papers.map(p=>{const lv=currentLevel(p);return `<article class="paper-card ${p.id===state.id?'active':''}"><div class="paper-card-main"><div class="paper-card-title">${esc(p.paperTitle||'未命名論文')}</div><div class="paper-card-meta">${esc(p.paperAuthor||'尚未填作者')}${p.paperVenue?' · '+esc(p.paperVenue):''}</div><div class="paper-card-foot"><span class="mini-level">Level ${lv}</span><span>最後編輯 ${formatDate(p.updatedAt)}</span></div></div><div class="paper-card-actions"><button class="secondary-btn edit-paper" data-id="${p.id}">編輯</button><button class="ghost-btn delete-paper" data-id="${p.id}">刪除</button></div></article>`;}).join(''):'<p class="empty-state">找不到符合的論文。</p>';
  box.querySelectorAll('.edit-paper').forEach(b=>b.onclick=()=>openPaper(b.dataset.id));box.querySelectorAll('.delete-paper').forEach(b=>b.onclick=()=>deletePaper(b.dataset.id));
}

function renderCompare(){
  const picker=document.getElementById('comparePicker');
  picker.innerHTML=db.papers.map(p=>`<label class="compare-option"><input type="checkbox" data-id="${p.id}" ${compareIds.includes(p.id)?'checked':''}><span><strong>${esc(p.paperTitle||'未命名論文')}</strong><small>Level ${currentLevel(p)} · ${esc(p.paperAuthor||'')}</small></span></label>`).join('');
  picker.querySelectorAll('input').forEach(cb=>cb.onchange=()=>{
    if(cb.checked){if(compareIds.length>=4){cb.checked=false;alert('一次最多比較 4 篇。');return;}compareIds.push(cb.dataset.id);}else compareIds=compareIds.filter(id=>id!==cb.dataset.id);renderCompare();
  });
  const selected=compareIds.map(id=>db.papers.find(p=>p.id===id)).filter(Boolean);
  const wrap=document.getElementById('compareTableWrap');
  if(selected.length<2){wrap.innerHTML='<p class="empty-state">請至少選 2 篇論文開始比較。</p>';return;}
  const rows=[['Level',p=>`Level ${currentLevel(p)}`],['Problem',p=>p.answers.problem],['Gap',p=>p.answers.gap],['Data',p=>p.answers.data],['Method',p=>p.answers.method],['Finding',p=>p.answers.finding],['Limitation',p=>p.answers.limitation],['My Use',p=>p.answers.myuse]];
  wrap.innerHTML=`<table class="compare-table"><thead><tr><th>Dimension</th>${selected.map(p=>`<th>${esc(p.paperTitle||'未命名')}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th>${label}</th>${selected.map(p=>`<td>${esc(fn(p)||'—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderGapInsights(){
  const box=document.getElementById('gapInsights');
  const useful=db.papers.filter(p=>p.answers.gap||p.answers.limitation||p.answers.myuse);
  if(!useful.length){box.innerHTML='<p class="empty-state">先完成幾篇論文的 Gap、Limitation 或 My Use，這裡才會開始累積線索。</p>';return;}
  box.innerHTML=useful.map(p=>`<article class="gap-item"><div class="gap-item-head"><strong>${esc(p.paperTitle||'未命名論文')}</strong><span>Level ${currentLevel(p)}</span></div>${p.answers.gap?`<p><b>Gap</b> ${esc(p.answers.gap)}</p>`:''}${p.answers.limitation?`<p><b>Limitation</b> ${esc(p.answers.limitation)}</p>`:''}${p.answers.myuse?`<p><b>My Use</b> ${esc(p.answers.myuse)}</p>`:''}</article>`).join('');
}

function openPaper(id){persist();const p=db.papers.find(x=>x.id===id);if(!p)return;state=normalizePaper(p);db.activeId=state.id;localStorage.setItem(DB_KEY,JSON.stringify(db));fillEditor();document.getElementById('editorTop').scrollIntoView({behavior:'smooth'});}
function deletePaper(id){const p=db.papers.find(x=>x.id===id);if(!p)return;if(!confirm(`刪除「${p.paperTitle||'未命名論文'}」？此動作無法復原。`))return;db.papers=db.papers.filter(x=>x.id!==id);compareIds=compareIds.filter(x=>x!==id);if(!db.papers.length)db.papers=[blankPaper()];if(state.id===id){state=db.papers[0];db.activeId=state.id;fillEditor();}localStorage.setItem(DB_KEY,JSON.stringify(db));renderLibrary();renderDashboard();renderCompare();renderGapInsights();}
function newPaper(){persist();state=blankPaper();db.papers.unshift(state);db.activeId=state.id;localStorage.setItem(DB_KEY,JSON.stringify(db));fillEditor();renderDashboard();renderCompare();renderGapInsights();document.getElementById('editorTop').scrollIntoView({behavior:'smooth'});}

function renderGuide(){
  const g=document.getElementById('guide');g.innerHTML=guideItems.map((x,i)=>`<section class="card guide-item" data-number="${i+1}"><div class="guide-inner"><span class="step-label">${x.key.toUpperCase()}</span><h2 class="guide-question">${x.title}</h2><p class="guide-en">${x.en}</p><p class="guide-help">${x.help}</p><textarea id="a-${x.key}" rows="6" placeholder="${x.placeholder}"></textarea><label class="guide-check"><input id="c-${x.key}" type="checkbox">我可以不用看原文，自己說出這一格。</label></div></section>`).join('');
  guideItems.forEach(x=>{const a=document.getElementById('a-'+x.key),c=document.getElementById('c-'+x.key);a.oninput=()=>{state.answers[x.key]=a.value;markSaving();persist();};c.onchange=()=>{state.checks[x.key]=c.checked;persist();};});
}
function renderLevelChecks(){
  const box=document.getElementById('levelChecks');box.innerHTML=levels.map(l=>`<article class="level-panel"><div class="level-panel-head"><div class="level-number">${l.n}</div><div><h3>Level ${l.n} · ${l.name}</h3><p>${l.description}</p></div><span class="level-result" id="result-${l.n}"></span></div><div class="criteria">${l.checks.map((c,i)=>`<label class="criterion"><input type="checkbox" id="lc-${l.n}-${i}"><span>${c}</span></label>`).join('')}</div><label class="editable-note">我的 Level ${l.n} 筆記<textarea id="ln-${l.n}" rows="4" placeholder="${l.notePrompt}"></textarea></label></article>`).join('');
  levels.forEach(l=>{l.checks.forEach((_,i)=>{document.getElementById(`lc-${l.n}-${i}`).onchange=e=>{state.levelChecks[l.n][i]=e.target.checked;persist();updateLevelPanels();};});document.getElementById(`ln-${l.n}`).oninput=e=>{state.levelNotes[l.n]=e.target.value;markSaving();persist();};});
}
function updateLevelPanels(){levels.forEach(l=>{const count=(state.levelChecks[l.n]||[]).filter(Boolean).length,r=document.getElementById(`result-${l.n}`);r.textContent=levelComplete(state,l.n)?'完成':`${count}/${l.checks.length}`;r.classList.toggle('complete',levelComplete(state,l.n));});renderLevelStatus();}
function markSaving(){const s=document.getElementById('saveState');if(s)s.textContent='儲存中…';}
function fillEditor(){['paperTitle','paperAuthor','paperVenue','paperUrl','oneMinuteSummary'].forEach(id=>document.getElementById(id).value=state[id]||'');guideItems.forEach(x=>{document.getElementById('a-'+x.key).value=state.answers[x.key]||'';document.getElementById('c-'+x.key).checked=!!state.checks[x.key];});levels.forEach(l=>{l.checks.forEach((_,i)=>document.getElementById(`lc-${l.n}-${i}`).checked=!!state.levelChecks[l.n][i]);document.getElementById(`ln-${l.n}`).value=state.levelNotes[l.n]||'';});document.getElementById('editorTitle').textContent=state.paperTitle?`編輯：${state.paperTitle}`:'編輯這篇論文';progress();renderLevelStatus();updateLevelPanels();renderLibrary(document.getElementById('paperSearch')?.value||'');}
function bind(){['paperTitle','paperAuthor','paperVenue','paperUrl','oneMinuteSummary'].forEach(id=>{document.getElementById(id).oninput=e=>{state[id]=e.target.value;if(id==='paperTitle')document.getElementById('editorTitle').textContent=e.target.value?`編輯：${e.target.value}`:'編輯這篇論文';markSaving();persist();};});}
function summary(){const a=state.answers;const t=`This paper studies ${a.problem||'______'}.\n\nPrevious research is limited by ${a.gap||'______'}.\n\nThe authors use ${a.data||'______'} and apply ${a.method||'______'}.\n\nThe main findings are ${a.finding||'______'}.\n\nThe main limitation is ${a.limitation||'______'}.\n\nFor my research, I can use ${a.myuse||'______'}.`;document.getElementById('oneMinuteSummary').value=t;state.oneMinuteSummary=t;persist();}
function md(){const a=state.answers,lv=currentLevel();const levelNotes=levels.map(l=>`## Level ${l.n} — ${l.name}\nStatus: ${levelComplete(state,l.n)?'Complete':'Incomplete'}\n\n${state.levelNotes[l.n]||''}`).join('\n\n');return `# ${state.paperTitle||'Paper Reading Notes'}\n\n- **Author / Year:** ${state.paperAuthor}\n- **Venue:** ${state.paperVenue}\n- **URL:** ${state.paperUrl}\n- **Current Understanding:** Level ${lv}${lv?' — '+levels[lv-1].name:''}\n\n## 1. Problem\n${a.problem}\n\n## 2. Gap\n${a.gap}\n\n## 3. Data\n${a.data}\n\n## 4. Method\n${a.method}\n\n## 5. Finding\n${a.finding}\n\n## 6. Limitation\n${a.limitation}\n\n## 7. My Use\n${a.myuse}\n\n## 1-Minute Synthesis\n${state.oneMinuteSummary}\n\n# Understanding Levels\n\n${levelNotes}\n`;}
function download(name,text,type){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
function fileName(){return (state.paperTitle||'paper-notes').replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,'-').slice(0,80);}
function theme(){document.body.classList.toggle('dark',dark);document.getElementById('themeBtn').textContent=dark?'淺色模式':'深色模式';}
function go(id){document.getElementById(id).scrollIntoView({behavior:'smooth'});}

document.addEventListener('DOMContentLoaded',()=>{
  renderGuide();renderLevelChecks();bind();theme();fillEditor();renderDashboard();renderCompare();renderGapInsights();
  document.getElementById('gapHypothesis').value=localStorage.getItem(GAP_NOTE_KEY)||'';
  document.getElementById('gapHypothesis').oninput=e=>localStorage.setItem(GAP_NOTE_KEY,e.target.value);
  document.getElementById('paperSearch').oninput=e=>renderLibrary(e.target.value);
  document.getElementById('newPaperBtn').onclick=newPaper;document.getElementById('saveNowBtn').onclick=()=>persist('已儲存');document.getElementById('clearCompareBtn').onclick=()=>{compareIds=[];renderCompare();};
  document.getElementById('goLibraryBtn').onclick=()=>go('librarySection');document.getElementById('goCompareBtn').onclick=()=>go('compareSection');document.getElementById('goGapBtn').onclick=()=>go('gapSection');
  document.getElementById('buildSummaryBtn').onclick=summary;document.getElementById('copyMdBtn').onclick=async()=>{await navigator.clipboard.writeText(md());alert('已複製 Markdown。');};document.getElementById('downloadMdBtn').onclick=()=>download(fileName()+'.md',md(),'text/markdown');document.getElementById('exportJsonBtn').onclick=()=>download('paper-reading-library-backup.json',JSON.stringify(db,null,2),'application/json');
  document.getElementById('importJsonInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const incoming=JSON.parse(await f.text());if(!incoming||!Array.isArray(incoming.papers))throw new Error();db={papers:incoming.papers.map(normalizePaper),activeId:incoming.activeId};if(!db.papers.length)db.papers=[blankPaper()];state=db.papers.find(p=>p.id===db.activeId)||db.papers[0];db.activeId=state.id;localStorage.setItem(DB_KEY,JSON.stringify(db));fillEditor();renderDashboard();renderCompare();renderGapInsights();alert('已匯入論文資料庫。');}catch{alert('JSON 格式無法讀取。');}};
  document.getElementById('themeBtn').onclick=()=>{dark=!dark;localStorage.setItem(DARK_KEY,dark?'1':'0');theme();};
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
});