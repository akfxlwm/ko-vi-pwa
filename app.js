// ============================
// KO–VI Quiz PWA — app.js
// 계획 반영:
// - 정답 제출 즉시 다음 문제로 전환
// - 정오답 안내는 비차단 토스트로 3초간 표시
// - 엔터/클릭 중복 제출 방지(락)
// - 제출 기록 누적 + UI 언어 토글(한국어/베트남어)
// ============================

// ---------- 요소 참조 ----------
const E = (id)=>document.getElementById(id);
const ELS = {
  // 헤더/상단
  hTitle: E('hTitle'),
  btnLang: E('btnLang'),
  swStatus: E('swStatus'),

  // 시작 섹션
  startSectionTitle: E('startSectionTitle'),
  labelLessonSelect: E('labelLessonSelect'),
  lessonSelect: E('lessonSelect'),
  lessonButtons: E('lessonButtons'),
  hintlineText: E('hintlineText'),
  labelQCount: E('labelQCount'),
  qCount: E('qCount'),
  optRandom: E('optRandom'),
  optStrict: E('optStrict'),
  optTimer: E('optTimer'),
  optRandomLabel: E('optRandomLabel'),
  optStrictLabel: E('optStrictLabel'),
  optTimerLabel: E('optTimerLabel'),
  btnStart: E('btnStart'),

  // 퀴즈 섹션
  quiz: E('quiz'),
  cur: E('cur'),
  total: E('total'),
  acc: E('acc'),
  timerWrap: E('timer'),
  sec: E('sec'),
  vi: E('viText'),
  note: E('noteText'),
  answer: E('answer'),
  btnSubmit: E('btnSubmit'),     // 좌측 "정답 제출"
  btnHint: E('btnHint'),
  btnPass: E('btnPass'),
  btnShow: E('btnShow'),
  feedback: E('feedback'),       // 힌트 등 보조 메시지

  // 결과 섹션
  result: E('result'),
  resultTitle: E('resultTitle'),
  scoreLabel: E('scoreLabel'),
  accuracyLabel: E('accuracyLabel'),
  score: E('score'),
  resultTotal: E('resultTotal'),
  resultAcc: E('resultAcc'),
  wrongTitle: E('wrongTitle'),
  wrongList: E('wrongList'),

  // 제출 기록
  historyPanel: E('historyPanel'),
  historyTitle: E('historyTitle'),
  historyList: E('historyList'),
  btnClearHistory: E('btnClearHistory'),

  // 메타 라벨
  labelQuestionCounter: E('labelQuestionCounter'),
  labelAccuracy: E('labelAccuracy'),

  // 토스트(정오답 3초 비차단 안내)
  toast: E('toast'),

  // 푸터
  footerNote: E('footerNote'),
};

// ---------- 환경 상수/상태 ----------
const TOAST_MS = 3000;   // 토스트 노출 시간
let toastTimer = null;

let uiLang = localStorage.getItem('uiLang') || 'ko';
let DB = null;            // { lessons: [{lessonId,title,items:[{ko,vi,altKo[],note}]}] }
let pool = [];            // 현재 세션 문제 리스트
let order = [];           // 출제 순서(인덱스 배열)
let idx = 0;              // 현재 문제 인덱스(0-based)
let correct = 0;          // 정답 수
let wrong = [];           // 오답 모음
let timerId = null;       // 타이머
let secs = 0;             // 경과 초

// 같은 문제에서 엔터/클릭이 겹칠 때 1회만 처리하기 위한 락
let isAdvancing = false;

// 제출 기록 누적
const history = [];

let lessonsMeta = [];
const selectedLessons = new Set();
let hasSeededLessons = false;

// ---------- i18n ----------
const I18N = {
  ko: {
    title:'한–베 단어 타자 퀴즈',
    startTitle:'학습 시작',
    lessonSelect:'과목 선택',
    hintline:'원하는 과목 버튼을 눌러 켜거나 끄세요.',
    qCount:'문항 수',
    optRandom:'랜덤 출제',
    optStrict:'엄격 채점(공백/기호 불허)',
    optTimer:'타이머 표시',
    start:'공부 시작',
    submit:'정답 제출',
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
    langBtn:'VI',
  },
  vi: {
    title:'Gõ tiếng Hàn theo nghĩa',
    startTitle:'Bắt đầu học',
    lessonSelect:'Chọn bài học (ấn nút để bật/tắt)',
    hintline:'Nhấn nút để bật/tắt bài học mong muốn.',
    qCount:'Số câu',
    optRandom:'Xáo thứ tự',
    optStrict:'Chấm nghiêm (không bỏ khoảng/ký tự)',
    optTimer:'Hiện đồng hồ',
    start:'Bắt đầu',
    submit:'Gửi đáp án',
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
    langBtn:'KO',
  }
};

function applyI18n() {
  const t = I18N[uiLang];
  document.documentElement.lang = (uiLang === 'ko' ? 'ko' : 'vi');
  // 헤더/버튼
  ELS.hTitle.textContent = t.title;
  ELS.btnLang.textContent = t.langBtn;
  // 시작 섹션
  ELS.startSectionTitle.textContent = t.startTitle;
  ELS.labelLessonSelect.textContent = t.lessonSelect;
  if (ELS.lessonButtons) {
    ELS.lessonButtons.setAttribute('aria-label', t.lessonSelect);
    ELS.hintlineText.textContent = t.hintline;
  } else if (ELS.lessonSelect) {
    ELS.hintlineText.textContent = (uiLang === 'ko'
      ? '⌘/Ctrl + 클릭으로 다중 선택'
      : 'Giữ ⌘/Ctrl để chọn nhiều');
  } else {
    ELS.hintlineText.textContent = t.hintline;
  }
  ELS.labelQCount.textContent = t.qCount;
  ELS.optRandomLabel.textContent = t.optRandom;
  ELS.optStrictLabel.textContent = t.optStrict;
  ELS.optTimerLabel.textContent = t.optTimer;
  ELS.btnStart.textContent = t.start;
  // 퀴즈 섹션
  ELS.labelQuestionCounter.textContent = t.questionCounter;
  ELS.labelAccuracy.textContent = t.accuracy;
  ELS.btnSubmit.textContent = t.submit;
  ELS.btnHint.textContent = t.hint;
  ELS.btnPass.textContent = t.pass;
  ELS.btnShow.textContent = t.show;
  ELS.answer.placeholder = t.placeholder;
  // 결과 섹션
  ELS.resultTitle.textContent = t.resultTitle;
  ELS.scoreLabel.textContent = t.scoreLabel;
  ELS.accuracyLabel.textContent = t.accLabel;
  ELS.wrongTitle.textContent = t.wrongTitle;
  // 기록/푸터
  ELS.historyTitle.textContent = t.historyTitle;
  ELS.btnClearHistory.textContent = t.clearHistory;
  ELS.footerNote.textContent = t.footerNote;
  // SW 상태 초기 문구
  ELS.swStatus.textContent = t.offlineNotReady;
}

ELS.btnLang.addEventListener('click', () => {
  uiLang = (uiLang === 'ko' ? 'vi' : 'ko');
  localStorage.setItem('uiLang', uiLang);
  applyI18n();
});

// ---------- 데이터 로딩 ----------
async function tryLoadAllJson() {
  try {
    const res = await fetch('data/all.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function ensureMetaOptions() {
  if (!DB) {
    DB = await tryLoadAllJson();
  }
  if (!lessonsMeta.length) {
    if (DB && Array.isArray(DB.lessons)) {
      lessonsMeta = DB.lessons.map(L => ({ lessonId: L.lessonId, title: L.title }));
    } else if (window.HV_LESSONS && Array.isArray(window.HV_LESSONS)) {
      lessonsMeta = window.HV_LESSONS.map(L => ({ lessonId: L.id, title: L.title }));
    }
  }
  if (!lessonsMeta.length) return;

  if (ELS.lessonButtons) {
    const available = new Set(lessonsMeta.map(L => L.lessonId));
    selectedLessons.forEach(id => { if (!available.has(id)) selectedLessons.delete(id); });
    if (selectedLessons.size) {
      hasSeededLessons = true;
    }
    if (!selectedLessons.size && !hasSeededLessons) {
      selectedLessons.add(lessonsMeta[0].lessonId);
      hasSeededLessons = true;
    }
    renderLessonButtons();
  } else if (ELS.lessonSelect) {
    const prev = new Set(Array.from(ELS.lessonSelect.selectedOptions || []).map(o => o.value));
    ELS.lessonSelect.innerHTML = '';
    lessonsMeta.forEach(L => {
      const o = document.createElement('option');
      o.value = L.lessonId;
      o.textContent = `${L.lessonId} · ${L.title}`;
      if ((prev.size && prev.has(L.lessonId)) || (!prev.size && lessonsMeta[0].lessonId === L.lessonId)) {
        o.selected = true;
      }
      ELS.lessonSelect.appendChild(o);
    });
    if (!ELS.lessonSelect.selectedOptions.length && ELS.lessonSelect.options.length) {
      ELS.lessonSelect.options[0].selected = true;
    }
    const fallbackHint = uiLang === 'ko'
      ? '⌘/Ctrl + 클릭으로 다중 선택'
      : 'Giữ ⌘/Ctrl để chọn nhiều';
    ELS.hintlineText.textContent = fallbackHint;
  }
}

function renderLessonButtons() {
  if (!ELS.lessonButtons) return;
  ELS.lessonButtons.innerHTML = '';
  lessonsMeta.forEach(L => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lesson-btn';
    btn.dataset.lesson = L.lessonId;
    btn.textContent = `${L.lessonId} · ${L.title}`;
    const active = selectedLessons.has(L.lessonId);
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const willSelect = !selectedLessons.has(L.lessonId);
      if (willSelect) {
        selectedLessons.add(L.lessonId);
      } else {
        selectedLessons.delete(L.lessonId);
      }
      btn.classList.toggle('is-selected', willSelect);
      btn.setAttribute('aria-pressed', willSelect ? 'true' : 'false');
    });
    ELS.lessonButtons.appendChild(btn);
  });
}

// ---------- 유틸 ----------
const nf = (n)=> new Intl.NumberFormat().format(n);
function normalize(s, strict=false) {
  if (s == null) return "";
  let x = s.normalize('NFC').trim();
  if (!strict) x = x.replace(/[\s\u00A0\-\_·.,/!?:;'"“”‘’(){}\[\]<>]/g, '');
  return x;
}
function tick(){ secs += 1; ELS.sec.textContent = secs; }

function showToast(message, type/* 'ok' | 'bad' */) {
  if (!ELS.toast) return;
  // reset & set
  ELS.toast.classList.remove('ok','bad','visible');
  if (type) ELS.toast.classList.add(type);
  ELS.toast.innerHTML = message;
  // visible
  requestAnimationFrame(()=>{
    ELS.toast.classList.add('visible');
  });
  // timer reset
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{
    ELS.toast.classList.remove('visible');
  }, TOAST_MS);
}

// 제출 기록 DOM 추가
function appendHistoryEntry({vi, user, ok, ko, mode}) {
  const t = I18N[uiLang];
  const li = document.createElement('li');
  if (mode === 'show') {
    li.innerHTML = `<span class="bad">[${t.wrong}]</span> ${vi} → <b>${ko}</b> <em>(show)</em>`;
  } else if (mode === 'pass') {
    li.innerHTML = `<span class="bad">[${t.wrong}]</span> ${vi} → <b>${ko}</b> <em>(pass)</em>`;
  } else if (ok) {
    li.innerHTML = `<span class="ok">[${t.correct}]</span> ${vi} → <b>${ko}</b>`;
  } else {
    const u = (user && user.length) ? user : '-';
    li.innerHTML = `<span class="bad">[${t.wrong}]</span> ${vi} → ${t.answerIs} <b>${ko}</b> <small>(입력: ${u})</small>`;
  }
  ELS.historyList.appendChild(li);
  ELS.historyList.scrollTop = ELS.historyList.scrollHeight; // 하단 고정
}

ELS.btnClearHistory.addEventListener('click', ()=>{
  history.length = 0;
  ELS.historyList.innerHTML = '';
});

// ---------- 퀴즈 로직 ----------
async function startQuiz(){
  await ensureMetaOptions();
  let ids;
  if (ELS.lessonButtons) {
    ids = Array.from(selectedLessons);
  } else if (ELS.lessonSelect) {
    ids = Array.from(ELS.lessonSelect.selectedOptions).map(o=>o.value);
  } else {
    ids = [];
  }
  const t = I18N[uiLang];
  if (ids.length === 0) { alert(uiLang==='ko' ? '최소 1개 과목을 선택하세요.' : 'Hãy chọn ít nhất 1 bài học.'); return; }

  if (DB && DB.lessons) {
    const chosen = DB.lessons.filter(L=>ids.includes(L.lessonId));
    pool = chosen.flatMap(L=>L.items);
  } else if (window.HV_LESSONS) {
    const loaded = await Promise.all(ids.map(id => fetch(`data/${id}.json`).then(r=>r.json())));
    pool = loaded.flatMap(l => l.items);
  } else {
    alert(uiLang==='ko' ? '데이터를 찾을 수 없습니다.' : 'Không tìm thấy dữ liệu.');
    return;
  }

  order = [...Array(pool.length).keys()];
  if (ELS.optRandom.checked) {
    for (let i=order.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
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
  // 문제별 보조 메시지는 비움, 토스트는 유지
  ELS.feedback.innerHTML = '';
}

// 공용 제출(엔터/버튼) — 같은 문제 중복 방지
function submitAnswerOnce() {
  if (isAdvancing) return;
  isAdvancing = true;
  evaluate(false);       // 채점/토스트/다음 문제 전환
  isAdvancing = false;   // 다음 문제부터 다시 입력 가능
}

// 정답보기(학습용) — 비차단 토스트 + 즉시 다음 문제
function revealOnce() {
  if (isAdvancing) return;
  isAdvancing = true;
  evaluate(true);
  isAdvancing = false;
}

// 패스 — 비차단 토스트 + 즉시 다음 문제
function passOnce() {
  if (isAdvancing) return;
  isAdvancing = true;

  const t = I18N[uiLang];
  const q = pool[order[idx]];
  if (!q) { isAdvancing = false; return; }

  wrong.push(q);
  history.push({vi:q.vi, user:'(pass)', ok:false, ko:q.ko, mode:'pass'});
  appendHistoryEntry({vi:q.vi, user:'(pass)', ok:false, ko:q.ko, mode:'pass'});
  showToast(`${t.answerIs}: <b>${q.ko}</b>`, 'bad');

  idx++;
  ELS.acc.textContent = `${Math.round((correct/Math.max(1,idx))*100)}%`;

  // 즉시 전환
  if (idx >= order.length) finish();
  else showNext();

  isAdvancing = false;
}

// 정답 채점/표시(공용)
// - 제출 즉시 토스트 띄우고
// - 즉시 다음 문제로 전환(또는 종료)
function evaluate(showing=false) {
  const t = I18N[uiLang];
  const q = pool[order[idx]];
  if (!q) return;

  const strict = ELS.optStrict.checked;
  const ans = normalize(ELS.answer.value, strict);
  const target = normalize(q.ko, strict);
  const alts = (q.altKo||[]).map(x=>normalize(x, strict));
  const ok = !showing && ans.length>0 && (ans===target || alts.includes(ans));

  if (showing) {
    history.push({vi:q.vi, user:null, ok:false, ko:q.ko, mode:'show'});
    appendHistoryEntry({vi:q.vi, user:null, ok:false, ko:q.ko, mode:'show'});
    showToast(`${t.answerIs}: <b>${q.ko}</b>`, 'bad');
  } else if (ok) {
    correct++;
    history.push({vi:q.vi, user:ELS.answer.value, ok:true, ko:q.ko});
    appendHistoryEntry({vi:q.vi, user:ELS.answer.value, ok:true, ko:q.ko});
    showToast(`<b>${t.correct}!</b>`, 'ok');
  } else {
    wrong.push(q);
    history.push({vi:q.vi, user:ELS.answer.value, ok:false, ko:q.ko});
    appendHistoryEntry({vi:q.vi, user:ELS.answer.value, ok:false, ko:q.ko});
    showToast(`${t.wrong} · ${t.answerIs}: <b>${q.ko}</b>`, 'bad');
  }

  idx++;
  ELS.acc.textContent = `${Math.round((correct/Math.max(1,idx))*100)}%`;

  // 즉시 다음 문제로 전환(끝이면 결과로)
  if (idx >= order.length) finish();
  else showNext();
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

// ---------- 이벤트 바인딩 ----------
ELS.btnStart.addEventListener('click', startQuiz);
ELS.btnSubmit.addEventListener('click', submitAnswerOnce);
ELS.btnShow.addEventListener('click', revealOnce);
ELS.btnPass.addEventListener('click', passOnce);

ELS.answer.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    submitAnswerOnce(); // 엔터 중복 제출 방지
  }
});

ELS.btnHint.addEventListener('click', ()=>{
  const q = pool[order[idx]];
  if (!q) return;
  const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const cho=(ch)=>{const code=ch.charCodeAt(0)-0xAC00; if(code<0||code>11171)return ch; return CHO[Math.floor(code/588)];}
  const h = Array.from(q.ko).map(cho).join('');
  // 힌트는 문제별 보조 메시지(#feedback)에 노출
  ELS.feedback.innerHTML = `힌트: <b>${h}</b>`;
  ELS.answer.focus();
});

// ---------- 초기화 & SW 등록 ----------
applyI18n();
ensureMetaOptions();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(()=>{ ELS.swStatus.textContent = I18N[uiLang].offlinePreparing; })
      .catch(()=>{ ELS.swStatus.textContent = 'SW 등록 실패'; });
  });
}
