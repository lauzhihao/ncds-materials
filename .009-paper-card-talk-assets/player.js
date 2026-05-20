/* ──────────────────────────────────────────────────────────────────
   播放引擎（纯节奏版，无 TTS）
   - 把 BEATS 渲染为字幕序列，按字符数估算每句停留时长自动推进
   - 每个 beat 对应一个 scene（中央图）；同 scene 连续 beat 共享一张图
   - 录制模式：3 秒倒数 → 隐控件 → 自动从头播到尾
   - 音轨由用户在剪映里另接（API TTS / 真人 / 剪映文本朗读）
   ────────────────────────────────────────────────────────────────── */

(function () {
  const $ = (id) => document.getElementById(id);
  const beats = window.BEATS || [];
  const scenes = window.SCENES || {};
  const stack = $('sceneStack');
  const capZh = $('capZh');
  const capEn = $('capEn');
  const progress = $('progress');
  const band = $('band');

  // ── 构造 scene 节点（每个 SCENES 项一个节点） ──────────────────────
  const sceneOrder = [];
  const sceneSeen = new Set();
  for (const b of beats) {
    if (!sceneSeen.has(b.scene)) {
      sceneSeen.add(b.scene);
      sceneOrder.push(b.scene);
    }
  }

  const sceneNodes = {};
  for (const id of sceneOrder) {
    const def = scenes[id] || { prompt: '(未定义)', label: '' };
    const el = document.createElement('div');
    el.className = 'scene';
    if (id.startsWith('ch')) {
      el.classList.add('is-chapter');
      const num = ({ ch1: '一', ch2: '二', ch3: '三', ch4: '四', ch5: '五' })[id] || '';
      const firstBeat = beats.find(b => b.scene === id);
      const sub = firstBeat ? firstBeat.zh.replace(/^[一二三四五六七八九十]、/, '') : '';
      el.innerHTML =
        '<image-slot id="slot-' + id + '" placeholder="(可选) 拖入章节背景图，留空则用纯色封面"></image-slot>' +
        '<div class="chapter-card">' +
        '  <div class="chapter-num"><em>' + num + '</em></div>' +
        '  <div class="chapter-text">' + sub +
        '    <span class="small">第 ' + num + ' 章</span>' +
        '  </div>' +
        '</div>';
    } else {
      el.innerHTML =
        '<image-slot id="slot-' + id + '" placeholder="拖入此场景的图（详见左侧）"></image-slot>' +
        '<div class="placeholder">' +
        '  <div class="ph-id">' + id + '</div>' +
        '  <div class="ph-prompt">' + (def.prompt || '') + '</div>' +
        '</div>';
    }
    stack.appendChild(el);
    sceneNodes[id] = el;
  }

  // ── 当前 beat 状态 ─────────────────────────────────────────────
  let cur = 0;
  let playing = false;
  let pendingTimer = null;
  let advanceToken = 0;

  // ── 渲染当前 beat ──────────────────────────────────────────────
  function showBeat(i) {
    if (i < 0 || i >= beats.length) return;
    const b = beats[i];
    cur = i;
    capZh.textContent = b.zh;
    capEn.textContent = b.en;
    for (const id of sceneOrder) {
      sceneNodes[id].classList.toggle('active', id === b.scene);
    }
    progress.textContent = (i + 1) + ' / ' + beats.length;
  }

  // ── 按字符数估算一句的停留时长 ─────────────────────────────────
  function estimateMs(zh) {
    // 中文 ~0.20 sec/字 + 0.7 秒基础留白
    const n = (zh || '').replace(/\s/g, '').length;
    return Math.max(1000, n * 200 + 700);
  }

  // ── 主播放循环 ────────────────────────────────────────────────
  function playFrom(i) {
    if (!playing) return;
    if (i >= beats.length) { stop(); return; }
    showBeat(i);
    const rate = parseFloat($('rate').value) || 1;
    const ms = estimateMs(beats[i].zh) / rate;
    const myToken = ++advanceToken;
    pendingTimer = setTimeout(() => {
      if (myToken !== advanceToken || !playing) return;
      // 切到下一句前给一个极短的"喘息"
      setTimeout(() => playFrom(i + 1), 80);
    }, ms);
  }

  function play() {
    if (playing) return;
    playing = true;
    $('playBtn').textContent = '⏸ 暂停';
    playFrom(cur);
  }

  function pause() {
    playing = false;
    $('playBtn').textContent = '▶ 播放';
    advanceToken++;
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  }

  function stop() {
    pause();
  }

  // ── 控件 ──────────────────────────────────────────────────────
  $('playBtn').addEventListener('click', () => playing ? pause() : play());
  $('restartBtn').addEventListener('click', () => {
    pause();
    cur = 0;
    showBeat(0);
  });
  $('prevBtn').addEventListener('click', () => {
    const wasPlaying = playing;
    pause();
    showBeat(Math.max(0, cur - 1));
    if (wasPlaying) play();
  });
  $('nextBtn').addEventListener('click', () => {
    const wasPlaying = playing;
    pause();
    showBeat(Math.min(beats.length - 1, cur + 1));
    if (wasPlaying) play();
  });

  // 录制模式
  const recFlash = $('recFlash');
  $('recBtn').addEventListener('click', () => {
    enterRecording();
  });

  function enterRecording() {
    pause();
    cur = 0;
    showBeat(0);
    document.body.classList.add('recording');
    recFlash.classList.add('show');
    setTimeout(() => recFlash.classList.remove('show'), 2500);
    let n = 3;
    capZh.textContent = '准备录制… 3';
    capEn.textContent = 'Get ready…';
    const tick = setInterval(() => {
      n--;
      if (n > 0) {
        capZh.textContent = '准备录制… ' + n;
      } else {
        clearInterval(tick);
        play();
      }
    }, 1000);
  }

  function exitRecording() {
    document.body.classList.remove('recording');
    recFlash.classList.remove('show');
    pause();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('recording')) exitRecording();
      else pause();
    }
    if (e.key === ' ') {
      e.preventDefault();
      playing ? pause() : play();
    }
    if (e.key === 'ArrowRight') $('nextBtn').click();
    if (e.key === 'ArrowLeft')  $('prevBtn').click();
  });

  // ── 初始化 ─────────────────────────────────────────────────────
  showBeat(0);

  // 暴露给 Tweaks
  window.__player = { play, pause, showBeat, enterRecording, exitRecording, beats };
})();
