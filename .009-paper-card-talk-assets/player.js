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
        '  <div class="chapter-rule" aria-hidden="true"></div>' +
        '  <div class="chapter-text">' + sub + '</div>' +
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

  // ── 按字符数估算一句的停留时长 ─────────────────────────────────
  function estimateMs(zh) {
    // 中文 ~0.20 sec/字 + 0.7 秒基础留白
    const n = (zh || '').replace(/\s/g, '').length;
    return Math.max(1000, n * 200 + 700);
  }

  // ── 计算某个 scene 从 startIdx 起的连续 beat 总时长（ms，含 rate） ───
  // 用来把 Ken Burns 的 transform 时长设成"这个 scene 一共要播多久"，
  // 短句也能慢慢推完一镜，长句也不会推一半就重置。
  function computeSceneRunMs(startIdx) {
    const rate = parseFloat($('rate').value) || 1;
    const sc = beats[startIdx].scene;
    let total = 0;
    for (let j = startIdx; j < beats.length && beats[j].scene === sc; j++) {
      total += estimateMs(beats[j].zh) / rate;
    }
    // 加 80ms × N "喘息"间隔的近似补偿（与 playFrom 里 setTimeout(80) 对齐）
    return Math.max(800, total + 80);
  }

  // ── 字幕带溢出保护：缩放 capZh / capEn 至 band 容下为止 ───────────
  // ZH 字号上限可拉到 110px，长句会换行甚至撑爆字幕带，所以每次 showBeat 后
  // 测量一次，必要时按比例缩字号。重置→测量→缩，loop 最多 12 次。
  function fitBand() {
    capZh.style.fontSize = '';
    capEn.style.fontSize = '';
    void band.offsetHeight;
    // 横向：英文/中文都可能超宽
    for (const el of [capZh, capEn]) {
      let tries = 10;
      while (tries-- > 0 && el.scrollWidth > el.clientWidth + 1) {
        const sz = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = (sz * 0.93) + 'px';
      }
    }
    // 纵向：如果 band 内容总高超出，进一步缩中文
    let tries = 10;
    while (tries-- > 0 && band.scrollHeight > band.clientHeight + 1) {
      const sz = parseFloat(getComputedStyle(capZh).fontSize);
      capZh.style.fontSize = (sz * 0.92) + 'px';
    }
  }

  // ── 渲染当前 beat ──────────────────────────────────────────────
  function showBeat(i) {
    if (i < 0 || i >= beats.length) return;
    const b = beats[i];
    cur = i;
    capZh.textContent = b.zh;
    capEn.textContent = b.en;

    // 切换 active 类；记录哪些 scene 是新激活的，需要重置 Ken Burns
    const newSceneId = b.scene;
    const sceneEl = sceneNodes[newSceneId];
    const sceneWasActive = sceneEl.classList.contains('active');
    for (const id of sceneOrder) {
      sceneNodes[id].classList.toggle('active', id === newSceneId);
    }

    if (!sceneWasActive && document.body.classList.contains('ken-burns')) {
      // 新激活的 scene：先 snap 回 1.02 再启动按时长定制的 transform，
      // 保证镜头从头推、并恰好在该 scene 全部 beat 播完时到达 scale(1.06)。
      sceneEl.style.transition = 'none';
      // 强制 reflow，让 inline transition:none 立即生效
      void sceneEl.offsetWidth;
      const ms = computeSceneRunMs(i);
      sceneEl.style.transition = 'opacity 0.55s ease, transform ' + ms + 'ms ease-out';
    } else if (!document.body.classList.contains('ken-burns')) {
      // Ken Burns 关闭：清掉之前可能残留的 inline transition，让 CSS 默认的 .3s 起效
      sceneEl.style.transition = '';
    }

    progress.textContent = (i + 1) + ' / ' + beats.length;
    fitBand();
  }

  // ── 主播放循环 ────────────────────────────────────────────────
  function playFrom(i) {
    if (!playing) return;
    if (i >= beats.length) { endRun(); return; }
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

  // ── 片尾淡出 ──────────────────────────────────────────────────
  // 走完最后一个 beat 不立刻 stop()——挂 body.ending 1.5s：
  //   * 字幕淡到 0（视觉上的"END"信号，剪辑时也容易找尾）
  //   * 镜头继续慢推（Ken Burns 不被打断）
  //   * 不自动退出 recording，由用户按 Esc 决定何时收手
  function endRun() {
    document.body.classList.add('ending');
    setTimeout(() => {
      document.body.classList.remove('ending');
      stop();
      // body.ending 移除后字幕 opacity 会缓回 1，但此时 textContent 已经是
      // 最后一句的内容，会"复活"到屏上。手动清空避免回闪。
      capZh.textContent = '';
      capEn.textContent = '';
    }, 1500);
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
    document.body.classList.add('recording');

    // 倒数期间不预激活 scene——保留 play() 调用时通过 showBeat 走完整流程，
    // 这样 Ken Burns 的 transform 时长能按 scene-run 精确算。覆盖层近不透明，
    // 底下的空白不会露出来。
    for (const id of sceneOrder) {
      sceneNodes[id].classList.remove('active');
    }
    capZh.textContent = '';
    capEn.textContent = '';
    progress.textContent = '1 / ' + beats.length;

    const countdown = $('recCountdown');
    let n = 3;
    countdown.textContent = String(n);
    countdown.classList.add('show');
    const tick = setInterval(() => {
      n--;
      if (n > 0) {
        countdown.textContent = String(n);
      } else {
        clearInterval(tick);
        countdown.classList.remove('show');     // 覆盖层淡出 0.32s
        // 同时 play()：scene fade-in 在覆盖层淡出期间发生，
        // 视觉上是一个"自然显现"，不会有空一帧的尴尬。
        if (document.body.classList.contains('recording')) play();
      }
    }, 1000);
  }

  function exitRecording() {
    document.body.classList.remove('recording');
    recFlash.classList.remove('show');
    const countdown = $('recCountdown');
    if (countdown) {
      countdown.classList.remove('show');
      countdown.textContent = '';
    }
    pause();
  }

  document.addEventListener('keydown', (e) => {
    const isRecording = document.body.classList.contains('recording');
    if (e.key === 'Escape') {
      if (isRecording) exitRecording();
      else pause();
      return;
    }
    // 录制模式下只接 Esc：防止手抖按空格/方向键把视频卡在某一帧。
    if (isRecording) return;
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
