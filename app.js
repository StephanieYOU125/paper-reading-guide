const guideItems = [
  {key:'problem',title:'研究問題是什麼？',en:'What research question is this paper trying to answer?',help:'不要抄 title。用一句話說：作者到底想知道什麼？為什麼這件事值得研究？',placeholder:'The paper asks whether...'},
  {key:'gap',title:'研究缺口是什麼？',en:'What is missing, weak, or unresolved in previous research?',help:'找 Introduction 最後幾段：however, few studies, remains unclear, limited evidence...',placeholder:'過去研究做了什麼？還缺什麼？'},
  {key:'data',title:'資料是什麼？',en:'What data did the authors use, and where did it come from?',help:'寫出樣本、場域、期間、數量與資料來源。',placeholder:'Data source / sample size / study area / study period...'},
  {key:'method',title:'方法是什麼？',en:'How did the authors turn the data into an answer?',help:'先用 Input → Process → Output 說一次，再補模型、指標或統計方法。',placeholder:'Input → Process → Output'},
  {key:'finding',title:'主要發現是什麼？',en:'What are the 1–3 findings that actually matter?',help:'寫方向、大小、條件。不要只寫 significant / not significant。',placeholder:'Finding 1...\nFinding 2...\nFinding 3...'},
  {key:'limitation',title:'可信嗎？限制在哪裡？',en:'What assumptions, biases, or limitations could change the conclusion?',help:'想資料偏差、測量誤差、模型假設、樣本代表性、因果與外部效度。',placeholder:'作者承認的限制 + 你看到的限制'},
  {key:'myuse',title:'這篇論文對我有什麼用？',en:'How can this paper change my research, method, hypothesis, or next step?',help:'它可以當 baseline、method source、theory、dataset reference、gap，還是反例？',placeholder:'I can use...\nI should not directly copy...\nI want to test...'}
];

const STORAGE_KEY='paperReadingGuide_v1';
const defaults={paperTitle:'',paperAuthor:'',paperVenue:'',paperUrl:'',answers:{},checks:{},oneMinuteSummary:'',level:'',dark:false};
let state={...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};
state.answers={...Object.fromEntries(guideItems.map(x=>[x.key,''])),...(state.answers||{})};
state.checks={...Object.fromEntries(guideItems.map(x=>[x.key,false])),...(state.checks||{})};

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));document.getElementById('saveState').textContent='已自動儲存';progress();}
function progress(){const n=guideItems.filter(x=>state.checks[x.key]).length;document.getElementById('progressText').textContent=`${n} / 7`;document.getElementById('progressFill').style.width=`${n/7*100}%`;}
function render(){
  const g=document.getElementById('guide');
  g.innerHTML=guideItems.map((x,i)=>`<section class="card guide-item" data-number="${i+1}"><div class="guide-inner"><span class="step-label">${x.key.toUpperCase()}</span><h2 class="guide-question">${x.title}</h2><p class="guide-en">${x.en}</p><p class="guide-help">${x.help}</p><textarea id="a-${x.key}" rows="6" placeholder="${x.placeholder}"></textarea><label class="guide-check"><input id="c-${x.key}" type="checkbox">我可以不用看原文，自己說出這一格。</label></div></section>`).join('');
  guideItems.forEach(x=>{const a=document.getElementById('a-'+x.key),c=document.getElementById('c-'+x.key);a.value=state.answers[x.key];c.checked=state.checks[x.key];a.oninput=()=>{state.answers[x.key]=a.value;save();};c.onchange=()=>{state.checks[x.key]=c.checked;save();};});
}
function bind(){
  ['paperTitle','paperAuthor','paperVenue','paperUrl','oneMinuteSummary'].forEach(id=>{const el=document.getElementById(id);el.value=state[id]||'';el.oninput=()=>{state[id]=el.value;save();};});
  document.querySelectorAll('input[name="level"]').forEach(r=>{r.checked=r.value===String(state.level);r.onchange=()=>{state.level=r.value;save();};});
}
function summary(){const a=state.answers;const t=`This paper studies ${a.problem||'______'}.\n\nPrevious research is limited by ${a.gap||'______'}.\n\nThe authors use ${a.data||'______'} and apply ${a.method||'______'}.\n\nThe main findings are ${a.finding||'______'}.\n\nThe main limitation is ${a.limitation||'______'}.\n\nFor my research, I can use ${a.myuse||'______'}.`;document.getElementById('oneMinuteSummary').value=t;state.oneMinuteSummary=t;save();}
function md(){const a=state.answers;return `# ${state.paperTitle||'Paper Reading Notes'}\n\n- **Author / Year:** ${state.paperAuthor}\n- **Venue:** ${state.paperVenue}\n- **URL:** ${state.paperUrl}\n- **Understanding Level:** ${state.level?'Level '+state.level:'Not selected'}\n\n## 1. Problem\n${a.problem}\n\n## 2. Gap\n${a.gap}\n\n## 3. Data\n${a.data}\n\n## 4. Method\n${a.method}\n\n## 5. Finding\n${a.finding}\n\n## 6. Limitation\n${a.limitation}\n\n## 7. My Use\n${a.myuse}\n\n## 1-Minute Synthesis\n${state.oneMinuteSummary}\n`;}
function download(name,text,type){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
function fileName(){return (state.paperTitle||'paper-notes').replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,'-').slice(0,80);}
function theme(){document.body.classList.toggle('dark',!!state.dark);document.getElementById('themeBtn').textContent=state.dark?'淺色模式':'深色模式';}

document.addEventListener('DOMContentLoaded',()=>{
  render();bind();progress();theme();
  document.getElementById('buildSummaryBtn').onclick=summary;
  document.getElementById('copyMdBtn').onclick=async()=>{await navigator.clipboard.writeText(md());alert('已複製 Markdown。');};
  document.getElementById('downloadMdBtn').onclick=()=>download(fileName()+'.md',md(),'text/markdown');
  document.getElementById('exportJsonBtn').onclick=()=>download(fileName()+'-backup.json',JSON.stringify(state,null,2),'application/json');
  document.getElementById('importJsonInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state={...defaults,...JSON.parse(await f.text())};localStorage.setItem(STORAGE_KEY,JSON.stringify(state));location.reload();}catch{alert('JSON 格式無法讀取。');}};
  document.getElementById('themeBtn').onclick=()=>{state.dark=!state.dark;theme();save();};
  document.getElementById('newPaperBtn').onclick=()=>{if(confirm('開始新的論文筆記？目前內容會被清空。')){localStorage.removeItem(STORAGE_KEY);location.reload();}};
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
});
