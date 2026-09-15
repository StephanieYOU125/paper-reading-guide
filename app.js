const guideItems = [
  {key:'problem',title:'研究問題是什麼？',en:'What research question is this paper trying to answer?',help:'不要抄 title。用一句話說：作者到底想知道什麼？為什麼這件事值得研究？',placeholder:'The paper asks whether...'},
  {key:'gap',title:'研究缺口是什麼？',en:'What is missing, weak, or unresolved in previous research?',help:'找 Introduction 最後幾段：however, few studies, remains unclear, limited evidence...',placeholder:'過去研究做了什麼？還缺什麼？'},
  {key:'data',title:'資料是什麼？',en:'What data did the authors use, and where did it come from?',help:'寫出樣本、場域、期間、數量與資料來源。',placeholder:'Data source / sample size / study area / study period...'},
  {key:'method',title:'方法是什麼？',en:'How did the authors turn the data into an answer?',help:'先用 Input → Process → Output 說一次，再補模型、指標或統計方法。',placeholder:'Input → Process → Output'},
  {key:'finding',title:'主要發現是什麼？',en:'What are the 1–3 findings that actually matter?',help:'寫方向、大小、條件。不要只寫 significant / not significant。',placeholder:'Finding 1...\nFinding 2...\nFinding 3...'},
  {key:'limitation',title:'可信嗎？限制在哪裡？',en:'What assumptions, biases, or limitations could change the conclusion?',help:'想資料偏差、測量誤差、模型假設、樣本代表性、因果與外部效度。',placeholder:'作者承認的限制 + 你看到的限制'},
  {key:'myuse',title:'這篇論文對我有什麼用？',en:'How can this paper change my research, method, hypothesis, or next step?',help:'它可以當 baseline、method source、theory、dataset reference、gap，還是反例？',placeholder:'I can use...\nI should not directly copy...\nI want to test...'}
];

const levels = [
  {
    n:1,
    name:'Recognize｜找得到',
    short:'知道它在研究什麼',
    description:'可以定位論文的基本元素，不需要深入批判。',
    checks:[
      '我能指出研究問題與研究目的',
      '我知道資料來源與研究對象',
      '我知道作者用了什麼主要方法',
      '我能說出至少一個主要結果'
    ],
    notePrompt:'Level 1 筆記：這篇論文最基本是在做什麼？'
  },
  {
    n:2,
    name:'Explain｜說得出',
    short:'能不用看原文解釋',
    description:'不是認得名詞，而是可以用自己的話重建整篇研究邏輯。',
    checks:[
      '我能不用看原文，用 1 分鐘說出 Problem → Method → Finding',
      '我能解釋為什麼作者選這個方法',
      '我知道主要變數／指標代表什麼',
      '我能說明結果的方向、大小或條件，而不只是「有顯著」'
    ],
    notePrompt:'Level 2 筆記：如果我要教別人，我會怎麼解釋？'
  },
  {
    n:3,
    name:'Evaluate｜評得出',
    short:'能判斷它可信到哪裡',
    description:'開始從讀者變成審查者，知道結論在哪些條件下成立。',
    checks:[
      '我能指出至少一個重要假設或限制',
      '我能判斷資料是否足以支持作者的結論',
      '我能指出可能的偏差、混淆因素或外部效度問題',
      '我知道如果換場域、樣本或方法，結果可能怎麼改變'
    ],
    notePrompt:'Level 3 筆記：我同意什麼？懷疑什麼？為什麼？'
  },
  {
    n:4,
    name:'Use｜用得出',
    short:'能轉成自己的研究',
    description:'真正的博士閱讀：把別人的論文變成自己的研究決策。',
    checks:[
      '我知道這篇可當 baseline、method source、theory、gap 或反例中的哪一種',
      '我能說出哪些部分可以借用，哪些不能直接照搬',
      '我能提出至少一個延伸研究問題、假設或實驗設計',
      '我知道這篇論文會改變我下一步讀什麼或做什麼'
    ],
    notePrompt:'Level 4 筆記：我要怎麼把它轉成自己的研究下一步？'
  }
];

const STORAGE_KEY='paperReadingGuide_v2';
const oldKey='paperReadingGuide_v1';
const oldState=JSON.parse(localStorage.getItem(oldKey)||'{}');
const defaults={paperTitle:'',paperAuthor:'',paperVenue:'',paperUrl:'',answers:{},checks:{},oneMinuteSummary:'',dark:false,levelChecks:{},levelNotes:{}};
let state={...defaults,...oldState,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};
state.answers={...Object.fromEntries(guideItems.map(x=>[x.key,''])),...(state.answers||{})};
state.checks={...Object.fromEntries(guideItems.map(x=>[x.key,false])),...(state.checks||{})};
levels.forEach(l=>{
  if(!Array.isArray(state.levelChecks[l.n])) state.levelChecks[l.n]=l.checks.map(()=>false);
  if(typeof state.levelNotes[l.n] !== 'string') state.levelNotes[l.n]='';
});

function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const s=document.getElementById('saveState'); if(s) s.textContent='已自動儲存';
  progress(); renderLevelStatus();
}

function progress(){
  const n=guideItems.filter(x=>state.checks[x.key]).length;
  document.getElementById('progressText').textContent=`${n} / 7`;
  document.getElementById('progressFill').style.width=`${n/7*100}%`;
}

function levelComplete(n){
  return (state.levelChecks[n]||[]).length === levels[n-1].checks.length && (state.levelChecks[n]||[]).every(Boolean);
}

function currentLevel(){
  let achieved=0;
  for(const l of levels){
    if(levelComplete(l.n) && achieved===l.n-1) achieved=l.n;
    else break;
  }
  return achieved;
}

function renderLevelStatus(){
  const achieved=currentLevel();
  const name=achieved ? levels[achieved-1].name : '尚未建立基本理解';
  document.getElementById('currentLevel').textContent=`Level ${achieved}`;
  document.getElementById('currentLevelName').textContent=name;

  document.getElementById('levelTrack').innerHTML=levels.map(l=>{
    const done=l.n<=achieved;
    const active=l.n===Math.min(achieved+1,4) && achieved<4;
    return `<div class="level-step ${done?'done':''} ${active?'active':''}">
      <div class="level-dot">${done?'✓':l.n}</div>
      <div><strong>Level ${l.n}</strong><span>${l.short}</span></div>
    </div>`;
  }).join('');
}

function renderGuide(){
  const g=document.getElementById('guide');
  g.innerHTML=guideItems.map((x,i)=>`<section class="card guide-item" data-number="${i+1}"><div class="guide-inner"><span class="step-label">${x.key.toUpperCase()}</span><h2 class="guide-question">${x.title}</h2><p class="guide-en">${x.en}</p><p class="guide-help">${x.help}</p><textarea id="a-${x.key}" rows="6" placeholder="${x.placeholder}"></textarea><label class="guide-check"><input id="c-${x.key}" type="checkbox">我可以不用看原文，自己說出這一格。</label></div></section>`).join('');
  guideItems.forEach(x=>{
    const a=document.getElementById('a-'+x.key),c=document.getElementById('c-'+x.key);
    a.value=state.answers[x.key]; c.checked=state.checks[x.key];
    a.oninput=()=>{state.answers[x.key]=a.value;save();};
    c.onchange=()=>{state.checks[x.key]=c.checked;save();};
  });
}

function renderLevelChecks(){
  const box=document.getElementById('levelChecks');
  box.innerHTML=levels.map(l=>`<article class="level-panel" data-level="${l.n}">
    <div class="level-panel-head">
      <div class="level-number">${l.n}</div>
      <div><h3>Level ${l.n} · ${l.name}</h3><p>${l.description}</p></div>
      <span class="level-result" id="result-${l.n}"></span>
    </div>
    <div class="criteria">
      ${l.checks.map((c,i)=>`<label class="criterion"><input type="checkbox" id="lc-${l.n}-${i}"><span>${c}</span></label>`).join('')}
    </div>
    <label class="editable-note">我的 Level ${l.n} 筆記<textarea id="ln-${l.n}" rows="4" placeholder="${l.notePrompt}"></textarea></label>
  </article>`).join('');

  levels.forEach(l=>{
    l.checks.forEach((_,i)=>{
      const el=document.getElementById(`lc-${l.n}-${i}`);
      el.checked=!!state.levelChecks[l.n][i];
      el.onchange=()=>{state.levelChecks[l.n][i]=el.checked;save();updateLevelPanels();};
    });
    const ta=document.getElementById(`ln-${l.n}`);
    ta.value=state.levelNotes[l.n]||'';
    ta.oninput=()=>{state.levelNotes[l.n]=ta.value;save();};
  });
  updateLevelPanels();
}

function updateLevelPanels(){
  levels.forEach(l=>{
    const count=(state.levelChecks[l.n]||[]).filter(Boolean).length;
    const result=document.getElementById(`result-${l.n}`);
    result.textContent=levelComplete(l.n)?'完成':`${count}/${l.checks.length}`;
    result.classList.toggle('complete',levelComplete(l.n));
  });
  renderLevelStatus();
}

function bind(){
  ['paperTitle','paperAuthor','paperVenue','paperUrl','oneMinuteSummary'].forEach(id=>{
    const el=document.getElementById(id); el.value=state[id]||'';
    el.oninput=()=>{state[id]=el.value;save();};
  });
}

function summary(){
  const a=state.answers;
  const t=`This paper studies ${a.problem||'______'}.\n\nPrevious research is limited by ${a.gap||'______'}.\n\nThe authors use ${a.data||'______'} and apply ${a.method||'______'}.\n\nThe main findings are ${a.finding||'______'}.\n\nThe main limitation is ${a.limitation||'______'}.\n\nFor my research, I can use ${a.myuse||'______'}.`;
  document.getElementById('oneMinuteSummary').value=t; state.oneMinuteSummary=t; save();
}

function md(){
  const a=state.answers; const lv=currentLevel();
  const levelNotes=levels.map(l=>`## Level ${l.n} — ${l.name}\nStatus: ${levelComplete(l.n)?'Complete':'Incomplete'}\n\n${state.levelNotes[l.n]||''}`).join('\n\n');
  return `# ${state.paperTitle||'Paper Reading Notes'}\n\n- **Author / Year:** ${state.paperAuthor}\n- **Venue:** ${state.paperVenue}\n- **URL:** ${state.paperUrl}\n- **Current Understanding:** Level ${lv}${lv?' — '+levels[lv-1].name:''}\n\n## 1. Problem\n${a.problem}\n\n## 2. Gap\n${a.gap}\n\n## 3. Data\n${a.data}\n\n## 4. Method\n${a.method}\n\n## 5. Finding\n${a.finding}\n\n## 6. Limitation\n${a.limitation}\n\n## 7. My Use\n${a.myuse}\n\n## 1-Minute Synthesis\n${state.oneMinuteSummary}\n\n# Understanding Levels\n\n${levelNotes}\n`;
}

function download(name,text,type){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
function fileName(){return (state.paperTitle||'paper-notes').replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,'-').slice(0,80);}
function theme(){document.body.classList.toggle('dark',!!state.dark);document.getElementById('themeBtn').textContent=state.dark?'淺色模式':'深色模式';}

document.addEventListener('DOMContentLoaded',()=>{
  renderGuide(); renderLevelChecks(); bind(); progress(); theme(); renderLevelStatus();
  document.getElementById('buildSummaryBtn').onclick=summary;
  document.getElementById('copyMdBtn').onclick=async()=>{await navigator.clipboard.writeText(md());alert('已複製 Markdown。');};
  document.getElementById('downloadMdBtn').onclick=()=>download(fileName()+'.md',md(),'text/markdown');
  document.getElementById('exportJsonBtn').onclick=()=>download(fileName()+'-backup.json',JSON.stringify(state,null,2),'application/json');
  document.getElementById('importJsonInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state={...defaults,...JSON.parse(await f.text())};localStorage.setItem(STORAGE_KEY,JSON.stringify(state));location.reload();}catch{alert('JSON 格式無法讀取。');}};
  document.getElementById('themeBtn').onclick=()=>{state.dark=!state.dark;theme();save();};
  document.getElementById('newPaperBtn').onclick=()=>{if(confirm('開始新的論文筆記？目前內容會被清空。')){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(oldKey);location.reload();}};
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
});
