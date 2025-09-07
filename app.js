// ====== 요소 참조 ======
const E = (id)=>document.getElementById(id);
const ELS = {
  hTitle:E('hTitle'), btnLang:E('btnLang'),
  select:E('lessonSelect'), btnStart:E('btnStart'), qCount:E('qCount'),
  optRandom:E('optRandom'), optStrict:E('optStrict'), optTimer:E('optTimer'),
  labelLessonSelect:E('labelLessonSelect'), labelQCount:E('labelQCount'),
  optRandomLabel:E('optRandomLabel'), optStrictLabel:E('optStrictLabel'), optTimerLabel:E('optTimerLabel'),
  startSectionTitle:E('startSectionTitle'), hintlineText:E('hintlineText'),
  quiz:E('quiz'), vi:E('viText'), note:E('noteText'), answer:E('answer'),
  btnSubmit:E('btnSubmit'), btnHint:E('btnHint'), btnPass:E('btnPass'), btnShow:E('btnShow'),
  cur:E('cur'), total:E('total'), acc:E('acc'),
  timerWrap:E('timer'), sec:E('sec'), feedback:E('feedback'),
  result:E('result'), resultTitle:E('resultTitle'),
  scoreLabel:E('scoreLabel'), accuracyLabel:E('accuracyLabel'),
  score:E('score'), resultTotal:E('resultTotal'), resultAcc:E('resultAcc'),
  wrongTitle:E('wrongTitle'), wrongList:E('wrongList'),
  historyPanel:E('historyPanel'), historyTitle:E('historyTitle'),
  historyList:E('historyList'), btnClearHistory:E('btnClearHistory'),
  footerNote:E('footerNote'), swStatus:E('swStatus'),
};

// ====== i18n 사전 ======
const I18N = {
  ko: {
    title:'한–베 단어 타자 퀴즈',
    startTitle:'학습 시작',
    lessonSelect:'과 선택(복수 선택 가능)',
    hintline:'⌘/Ctrl + 클릭으로 다중 선택',
    qCount:'문항 수',
    optRandom:'랜덤 출제',
    optStrict:'엄격 채점(공백/기호 불허)',
    optTimer:'타이머 표시',
    start:'공부 시작',
    submit:'엔터=제출',
    hint:'힌트(초성)',
    pass:'패스',
    show:'정답보기',
    questionCounter:'문항',
    accuracy:'정답률',
    resultTitle:'결과',
    scoreLabel:'점수',
    accLabel:'정답률',
    wrongTitle:'오답 노트',
    historyTitle:'제출 기록',
    clearHistory:'기록 비우기',
    offlineNotReady:'오프라인 준비 안됨',
    offlinePreparing:'오프라인 준비 중…',
    footerNote:'오프라인 PWA · 데이터: 1–9과',
    correct:'정답',
    wrong:'오답',
    answerIs:'정답은',
    placeholder:'여기에 한국어 정답 입력',
    langBtn:'VI', // 버튼에 "VI" 표시 = 베트남어로 전환
  },
  vi: {
    title:'Gõ tiếng Hàn theo nghĩa',
    startTitle:'Bắt đầu học',
    lessonSelect:'Chọn bài (chọn nhiều)',
    hintline:'Giữ ⌘/Ctrl để chọn nhiều',
    qCount:'Số câu',
    optRandom:'Xáo thứ tự',
    optStrict:'Chấm nghiêm (không bỏ khoảng/ký tự)',
    optTimer:'Hiện đồng hồ',
    start:'Bắt đầu',
    submit:'Enter=Gửi',
    hint:'Gợi ý (phụ âm đầu)',
    pass:'Bỏ qua',
    show:'Xem đáp án',
    questionCounter:'Câu',
    accuracy:'Tỉ lệ đúng',
    resultTitle:'Kết quả',
    scoreLabel:'Điểm',
    accLabel:'Tỉ lệ đúng',
    wrongTitle:'Sai cần ôn',
    historyTitle:'Lịch sử trả lời',
    clearHistory:'Xóa lịch sử',
    offlineNotReady:'Chưa sẵn sàng ngoại tuyến',
    offlinePreparing:'Đang chuẩn bị ngoại tuyến…',
    footerNote:'PWA ngoại tuyến · Dữ liệu: Bài 1–9',
    correct:'Đúng',
    wrong:'Sai',
    answerIs:'Đáp án là',
    placeholder:'Nhập tiếng Hàn tại đây',
    langBtn:'KO', // 버튼에 "KO" 표시 = 한국어로 전환
  }
};
let uiLang = localStorage.getItem('uiLang') || 'ko';

// ====== i18n 적용 ======
function applyI18n() {
  const t = I18N[uiLang];
  document.documentElement.lang = uiLang === 'ko' ? 'ko' : 'vi';
  ELS.hTitle.textContent = t.title;
  ELS.startSectionTitle.textContent = t.startTitle;
  ELS.labelLessonSelect.textContent = t.lessonSelect;
  ELS.hintlineText.textContent = t.hintline;
  ELS.labelQCount.textContent = t.qCount;
  ELS.optRandomLabel.textContent = t.optRandom;
  ELS.optStrictLabel.textContent = t.optStrict;
  ELS.optTimerLabel.textContent = t.optTimer;
  ELS.btnStart.textContent = t.start;
  ELS.btnSubmit.textContent = t.submit;
  ELS.btnHint.textContent = t.hint;
  ELS.btnPass.textContent = t.pass;
  ELS.btnShow.textContent = t.show;
  ELS.resultTitle.textContent = t.resultTitle;
  ELS.scoreLabel.textContent = t.scoreLabel;
  ELS.accuracyLabel.textContent = t.accLabel;
  ELS.wrongTitle.textContent = t.wrongTitle;
  E('labelQuestionCounter').textContent = t.questionCounter;
  E('labelAccuracy').textContent = t.accuracy;
  ELS.historyTitle.textContent = t.historyTitle;
  ELS.btnClearHistory.textContent = t.clearHistory;
  ELS.footerNote.textContent = t.footerNote;
  ELS.answer.placeholder = t.placeholder;
  ELS.swStatus.textContent = t.offlineNotReady;
  ELS.btnLang.textContent = t.langBtn;
}
ELS.btnLang.addEventListener('click', () => {
  uiLang = (uiLang === 'ko' ? 'vi' : 'ko');
  localStorage.setItem('uiLang', uiLang);
  applyI18n();
});

// ====== 데이터 로딩 (all.json 우선, 실패 시 개별 JSON) ======
let DB = null; // {lessons:[{lessonId,title,items:[...]}]}
async function tryLoadAllJson() {
  try {
    const res = await fetch('data/all.json', {cache:'no-cache'});
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function ensureMetaOptions() {
  // all.json이 있으면 그걸로 옵션 구성
  DB = await tryLoadAllJson();
  if (DB && Array.isArray(DB.lessons)) {
    ELS.select.innerHTML = '';
    DB.lessons.forEach(L=>{
      const o=document.createElement('option');
      o.value=L.lessonId; o.textContent=`${L.lessonId}과 · ${L.title}`;
      ELS.select.appendChild(o);
    });
    if (ELS.select.options.length) ELS.select.options[0].selected = true;
    return;
  }
  // 없으면 기존 window.HV_LESSONS(meta) 사용 (이전 버전 호환)
  if (window.HV_LESSONS && Array.isArray(window.HV_LESSONS)) {
    ELS.select.innerHTML = '';
    window.HV_LESSONS.forEach(L=>{
      const o=document.createElement('option');
      o.value=L.id; o.textContent=`${L.id}과 · ${L.title}`;
      ELS.select.appendChild(o);
    });
    if (ELS.select.options.length) ELS.select.options[0].selected = true;
  }
}

// ====== 퀴즈 상태 ======
let pool=[], order=[], idx=0, correct=0, wrong=[], timerId=null, secs=0;
const history = []; // 제출 기록 누적

const nf=(n)=>new Intl.NumberFormat().format(n);
function tick(){ secs += 1; ELS.sec.textContent = secs; }

// 제출 기록 DOM 추가
function appendHistoryEntry({vi, user, ok, ko, mode}) {
  const t = I18N[uiLang];
  const li = document.createElement('li');
  // 예: [정답] Vị trí → 위치  /  [오답] Vị trí → (입력: 위치x), 정답은 위치
  if (mode === 'show') {
    li.innerHTML = `<span class="bad">[${t.wrong}]</span> ${vi} → <b>${ko}</b> <em>(show)</em>`;
  } else if (ok) {
    li.innerHTML = `<span class="ok">[${t.correct}]</span> ${vi} → <b>${ko}</b>`;
  } else {
    li.innerHTML = `<span class="bad">[${t.wrong}]</span> ${vi} → <em>${I18N[uiLang].answerIs}</em> <b>${ko}</b> <small>(입력: ${user||'-'})</small>`;
  }
  ELS.historyList.appendChild(li);
  // 스크롤 하단 고정
  ELS.historyList.scrollTop = ELS.historyList.scrollHeight;
}
ELS.btnClearHistory.addEventListener('click', ()=>{
  history.length = 0;
  ELS.historyList.innerHTML = '';
});

// ====== 퀴즈 로직 ======
async function startQuiz(){
  await ensureMetaOptions();
  const ids = Array.from(ELS.select.selectedOptions).map(o=>o.value);
  if (ids.length === 0) { alert(uiLang==='ko'?'최소 1개 과를 선택하세요.':'Hãy chọn ít nhất 1 bài.'); return; }

  if (DB && DB.lessons) {
    const chosen = DB.lessons.filter(L=>ids.includes(L.lessonId));
    pool = chosen.flatMap(L=>L.items);
  } else if (window.HV_LESSONS) {
    const loaded = await Promise.all(ids.map(id => fetch(`data/${id}.json`).then(r=>r.json())));
    pool = loaded.flatMap(l => l.items);
  } else {
    alert('데이터를 찾을 수 없습니다.');
    return;
  }

  order = [...Array(pool.length).keys()];
  if (ELS.optRandom.checked){
    for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  }
  const count = Math.max(1, Math.min(parseInt(ELS.qCount.value||'20',10), order.length));
  order = order.slice(0, count);

  idx=0; correct=0; wrong=[]; secs=0;
  ELS.total.textContent = nf(order.length);
  ELS.acc.textContent = '0%';
  ELS.feedback.textContent = '';
  ELS.result.classList.add('hidden');
  ELS.quiz.classList.remove('hidden');
  ELS.answer.value=''; ELS.answer.focus();
  if (ELS.optTimer.checked) { ELS.timerWrap.classList.remove('hidden'); timerId=setInterval(tick,1000); }
  else { ELS.timerWrap.classList.add('hidden'); if (timerId) { clearInterval(timerId); timerId=null; } }

  showNext();
}

function showNext(){
  if (idx >= order.length) return finish();
  const q = pool[order[idx]];
  ELS.cur.textContent = nf(idx+1);
  ELS.vi.textContent = q.vi;
  ELS.note.textContent = q.note || '';
  ELS.answer.value=''; ELS.answer.focus();
  ELS.feedback.innerHTML = '';
}

function evaluate(showing=false) {
  const t = I18N[uiLang];
  const q = pool[order[idx]];
  const strict = ELS.optStrict.checked;
  const ans = normalize(ELS.answer.value, strict);
  const target = normalize(q.ko, strict);
  const alts = (q.altKo||[]).map(x=>normalize(x, strict));
  const ok = !showing && ans.length>0 && (ans===target || alts.includes(ans));

  // 제출 기록 누적
  if (showing) {
    history.push({vi:q.vi, user:null, ok:false, ko:q.ko, mode:'show'});
    appendHistoryEntry({vi:q.vi, user:null, ok:false, ko:q.ko, mode:'show'});
    ELS.feedback.innerHTML = `${t.answerIs}: <b class="ok">${q.ko}</b> <span class="muted">(${q.vi})</span>`;
  } else if (ok) {
    history.push({vi:q.vi, user:ELS.answer.value, ok:true, ko:q.ko});
    appendHistoryEntry({vi:q.vi, user:ELS.answer.value, ok:true, ko:q.ko});
    ELS.feedback.innerHTML = `<span class="ok">${t.correct}!</span>`;
    correct++;
  } else {
    history.push({vi:q.vi, user:ELS.answer.value, ok:false, ko:q.ko});
    appendHistoryEntry({vi:q.vi, user:ELS.answer.value, ok:false, ko:q.ko});
    ELS.feedback.innerHTML = `<span class="bad">${t.wrong}</span> · ${t.answerIs} <b>${q.ko}</b>`;
    wrong.push(q);
  }

  idx++;
  ELS.acc.textContent = `${Math.round((correct/Math.max(1,idx))*100)}%`;
  if (idx >= order.length) setTimeout(finish, 380);
  else setTimeout(showNext, 220);
}

function finish(){
  if (timerId) { clearInterval(timerId); timerId=null; }
  ELS.quiz.classList.add('hidden');
  ELS.result.classList.remove('hidden');
  ELS.score.textContent = nf(correct);
  ELS.resultTotal.textContent = nf(order.length);
  ELS.resultAcc.textContent = `${Math.round((correct/order.length)*100)}%`;
  ELS.wrongList.innerHTML = '';
  wrong.forEach(q => {
    const li = document.createElement('li');
    li.textContent = `${q.vi} → ${q.ko}`;
    ELS.wrongList.appendChild(li);
  });
}

// ====== 유틸 ======
const normalize=(s,strict=false)=>{
  if (s == null) return "";
  let x = s.normalize('NFC').trim();
  if (!strict) x = x.replace(/[\s\u00A0\-\_·.,/!?:;'"“”‘’(){}\[\]<>]/g, '');
  return x;
};

// ====== 이벤트 ======
ELS.btnStart.addEventListener('click', startQuiz);
ELS.btnSubmit.addEventListener('click', ()=>evaluate(false));
ELS.btnHint.addEventListener('click', ()=>{
  const q = pool[order[idx]];
  if (!q) return;
  const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const cho=(ch)=>{const code=ch.charCodeAt(0)-0xAC00; if(code<0||code>11171)return ch; return CHO[Math.floor(code/588)];}
  const h = Array.from(q.ko).map(cho).join('');
  ELS.feedback.innerHTML = `힌트: <b>${h}</b>`;
  ELS.answer.focus();
});
ELS.btnPass.addEventListener('click', ()=>{
  const q = pool[order[idx]];
  if (!q) return;
  wrong.push(q);
  // 패스도 기록
  history.push({vi:q.vi, user:'(pass)', ok:false, ko:q.ko});
  appendHistoryEntry({vi:q.vi, user:'(pass)', ok:false, ko:q.ko});
  idx++;
  if (idx >= order.length) finish(); else showNext();
});
ELS.btnShow.addEventListener('click', ()=>evaluate(true));
ELS.answer.addEventListener('keydown', (e)=>{
  if (e.key==='Enter') { e.preventDefault(); evaluate(false); }
});

// ====== 서비스워커 등록 & i18n 초기화 ======
applyI18n();
ensureMetaOptions();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(()=>{ ELS.swStatus.textContent = I18N[uiLang].offlinePreparing; })
      .catch(()=>{ ELS.swStatus.textContent = 'SW 등록 실패'; });
  });
}
