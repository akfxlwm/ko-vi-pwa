// 데이터 한 번만 로드(all.json) → 과별 필터링
const E = (id)=>document.getElementById(id);
const ELS = {
  select:E('lessonSelect'), start:E('btnStart'), qCount:E('qCount'),
  optRandom:document.getElementById('optRandom'), optStrict:document.getElementById('optStrict'), optTimer:document.getElementById('optTimer'),
  quiz:E('quiz'), vi:E('viText'), note:E('noteText'), answer:E('answer'),
  submit:E('btnSubmit'), hint:E('btnHint'), pass:E('btnPass'), show:E('btnShow'),
  cur:E('cur'), total:E('total'), acc:E('acc'), timerWrap:document.getElementById('timer'), sec:E('sec'),
  feedback:E('feedback'), result:E('result'), score:E('score'),
  resultTotal:E('resultTotal'), resultAcc:E('resultAcc'), wrongList:E('wrongList'),
  swStatus:E('swStatus'),
};

const nf=(n)=>new Intl.NumberFormat().format(n);
const normalize=(s,strict=false)=>{ if(s==null)return""; let x=s.normalize('NFC').trim(); if(!strict) x=x.replace(/[\s\u00A0\-\_·.,/!?:;'"“”‘’(){}\[\]<>]/g,''); return x; };
const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const choOf=(ch)=>{const code=ch.charCodeAt(0)-0xAC00; if(code<0||code>11171) return ch; return CHO[Math.floor(code/588)];};
const toCho=(s)=>Array.from(s).map(choOf).join('');

let DB=null; // {lessons:[{lessonId,title,items:[{ko,vi,altKo[],note}]}]}
let pool=[], order=[], idx=0, correct=0, wrong=[], timerId=null, secs=0;

async function loadAll(){
  DB = await fetch('data/all.json').then(r=>r.json());
  // 과 목록 채우기
  const meta = DB.lessons.map(L=>({id:L.lessonId,title:L.title}));
  meta.forEach(L=>{ const o=document.createElement('option'); o.value=L.id; o.textContent=`${L.id}과 · ${L.title}`; ELS.select.appendChild(o); });
  if (ELS.select.options.length) ELS.select.options[0].selected = true;
}

function tick(){ secs+=1; ELS.sec.textContent = secs; }

async function startQuiz(){
  if(!DB) await loadAll();
  const ids = Array.from(ELS.select.selectedOptions).map(o=>o.value);
  if(ids.length===0){ alert('최소 1개 과를 선택하세요.'); return; }
  const chosen = DB.lessons.filter(L=>ids.includes(L.lessonId));
  pool = chosen.flatMap(L=>L.items);

  order = [...Array(pool.length).keys()];
  if (ELS.optRandom.checked) for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]];}
  const count = Math.max(1, Math.min(parseInt(ELS.qCount.value||'20',10), order.length));
  order = order.slice(0,count);

  idx=0; correct=0; wrong=[]; secs=0;
  ELS.total.textContent=nf(order.length); ELS.acc.textContent='0%'; ELS.feedback.textContent='';
  ELS.result.classList.add('hidden'); ELS.quiz.classList.remove('hidden'); ELS.answer.value=''; ELS.answer.focus();
  if (ELS.optTimer.checked){ ELS.timerWrap.classList.remove('hidden'); timerId=setInterval(tick,1000); } else { ELS.timerWrap.classList.add('hidden'); if(timerId){clearInterval(timerId); timerId=null;} }
  showNext();
}

function showNext(){ if(idx>=order.length) return finish();
  const q=pool[order[idx]];
  ELS.cur.textContent=nf(idx+1); ELS.vi.textContent=q.vi; ELS.note.textContent=q.note||'';
  ELS.answer.value=''; ELS.answer.focus(); ELS.feedback.innerHTML='';
}

function checkAnswer(showing=false){
  const q=pool[order[idx]];
  const strict=ELS.optStrict.checked;
  const ans=normalize(ELS.answer.value,strict);
  const target=normalize(q.ko,strict);
  const alts=(q.altKo||[]).map(x=>normalize(x,strict));
  const ok = ans.length>0 && (ans===target || alts.includes(ans));

  if (showing){ ELS.feedback.innerHTML = `정답: <b class="ok">${q.ko}</b> <span class="muted">(${q.vi})</span>`; wrong.push(q);}
  else if (ok){ correct++; ELS.feedback.innerHTML = `<span class="ok">정답!</span>`; }
  else { wrong.push(q); ELS.feedback.innerHTML = `<span class="bad">오답</span> · 정답은 <b>${q.ko}</b>`; }

  idx++; ELS.acc.textContent = `${Math.round((correct/Math.max(1,idx))*100)}%`;
  if (idx>=order.length) setTimeout(finish,380); else setTimeout(showNext,220);
}

function finish(){
  if (timerId) { clearInterval(timerId); timerId=null; }
  ELS.quiz.classList.add('hidden'); ELS.result.classList.remove('hidden');
  ELS.score.textContent = nf(correct);
  ELS.resultTotal.textContent = nf(order.length);
  ELS.resultAcc.textContent = `${Math.round((correct/order.length)*100)}%`;
  ELS.wrongList.innerHTML = '';
  wrong.forEach(q=>{ const li=document.createElement('li'); li.textContent = `${q.vi} → ${q.ko}`; ELS.wrongList.appendChild(li); });
}

function hint(){ const q=pool[order[idx]]; if(!q)return; ELS.feedback.innerHTML = `힌트(초성): <b>${toCho(q.ko)}</b>`; ELS.answer.focus(); }
function pass(){ const q=pool[order[idx]]; if(!q)return; wrong.push(q); idx++; if(idx>=order.length) finish(); else showNext(); }

ELS.start.addEventListener('click', startQuiz);
ELS.submit.addEventListener('click', ()=>checkAnswer(false));
ELS.hint.addEventListener('click', hint);
ELS.pass.addEventListener('click', pass);
ELS.show.addEventListener('click', ()=>checkAnswer(true));
ELS.answer.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); checkAnswer(false); } });

loadAll();
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(()=>{ ELS.swStatus.textContent='오프라인 준비 중…'; })
      .catch(()=>{ ELS.swStatus.textContent='SW 등록 실패'; });
  });
}
