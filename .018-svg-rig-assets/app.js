/* app.js — Playground 页面控制器
 * 把 UI（选角色 / 勾动作 / 调速度幅度）接到 RigSystem，并实时展示 Agent 的 JSON 契约。
 * 这一层只是「演示壳」，真正可复用的是 RigSystem + rig-spec/characters/motions。 */
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);

  const state = {
    character: 'cheer',
    motions: new Set(['raise-arms', 'idle-breathe']),
    speed: 1,
    intensity: 1,
    showJoints: false,
    preview: null,    // 当前预览 handle
    paused: false,
    seqMode: false,   // 套路模式
    seqCtrl: null,
    rafId: 0,
  };

  // ---------- 角色 chips ----------
  function buildCharChips() {
    const grid = $('#charGrid');
    grid.innerHTML = '';
    RigSystem.listCharacters().forEach((c) => {
      const chip = document.createElement('button');
      chip.className = 'char-chip' + (c.id === state.character ? ' active' : '');
      chip.dataset.id = c.id;
      chip.title = c.desc;
      chip.appendChild(RigSystem.build(c.id)); // 静态迷你预览
      const nm = document.createElement('span');
      nm.className = 'nm'; nm.textContent = c.name;
      chip.appendChild(nm);
      chip.addEventListener('click', () => { state.character = c.id; refresh(); });
      grid.appendChild(chip);
    });
  }

  // ---------- 动作勾选 ----------
  function buildMotionList() {
    const box = $('#motionList');
    box.innerHTML = '';
    RigSystem.listMotions().forEach((m) => {
      const item = document.createElement('label');
      item.className = 'motion-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = state.motions.has(m.id); cb.value = m.id;
      cb.addEventListener('change', () => {
        if (cb.checked) state.motions.add(m.id); else state.motions.delete(m.id);
        replay();
      });
      const txt = document.createElement('div');
      txt.innerHTML = '<div class="mi-name">' + m.name + '</div><div class="mi-desc">' + m.desc + '</div>';
      item.appendChild(cb); item.appendChild(txt);
      box.appendChild(item);
    });
  }

  // ---------- 关节锚点叠加 ----------
  function applyJoints(handle) {
    if (!handle) return;
    const old = handle.el.querySelector('.joints');
    if (old) old.remove();
    if (!state.showJoints) return;
    const SVGNS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'joints');
    Object.keys(handle.bones).forEach((name) => {
      const spec = RigSystem.spec.BONES && RigSystem.spec.BONES[name];
      if (!spec) return;
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('class', 'joint-dot');
      dot.setAttribute('cx', spec.pivot[0]); dot.setAttribute('cy', spec.pivot[1]);
      dot.setAttribute('r', '5');
      g.appendChild(dot);
    });
    handle.el.appendChild(g);
  }

  // ---------- 套路 / 连贯动作 ----------
  function buildSeqPanel() {
    const pick = $('#seqPick');
    pick.innerHTML = '';
    RigSystem.listSequences().forEach((seq) => {
      const btn = document.createElement('button');
      btn.className = 'seq-btn';
      btn.innerHTML = '▶ 演练「' + seq.name + '」<span class="small">' + seq.desc + '</span>';
      btn.addEventListener('click', () => startSequence(seq.id));
      pick.appendChild(btn);
    });
    const first = RigSystem.listSequences()[0];
    if (first) renderMoveList(first); // 未播放时也先把招式列表展示出来
  }

  function renderMoveList(seq) {
    const ol = $('#moveList');
    ol.innerHTML = '';
    if (!seq) return;
    seq.moves.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'move-li';
      li.innerHTML = '<div class="ml-name">' + m.name + '</div><div class="ml-desc">' + m.desc + '</div>';
      ol.appendChild(li);
    });
  }

  function startSequence(seqId) {
    stopSeqLoop();
    const seq = RigSystem.listSequences().find((s) => s.id === seqId);
    // 套路需要二段肢体角色：强制切到武者
    state.character = 'wushu';
    document.querySelectorAll('.char-chip').forEach((el) =>
      el.classList.toggle('active', el.dataset.id === 'wushu'));
    const box = $('#previewRig');
    if (state.preview) state.preview.__anims.forEach((a) => a.cancel());
    box.innerHTML = '';
    state.preview = RigSystem.mount(box, 'wushu');
    state.seqCtrl = RigSystem.playSequence(state.preview, seqId, { speed: state.speed });
    state.seqMode = true; state.paused = false;
    $('#playBtn').textContent = '⏸ 暂停';
    $('#moveCaption').hidden = false;
    applyJoints(state.preview);
    renderMoveList(seq);
    updateJson();
    runSeqLoop();
  }

  function runSeqLoop() {
    const items = document.querySelectorAll('#moveList .move-li');
    let last = -2;
    const tick = () => {
      if (!state.seqMode || !state.seqCtrl) return;
      const idx = state.seqCtrl.currentMove();
      if (idx !== last) {
        last = idx;
        items.forEach((el, i) => el.classList.toggle('active', i === idx));
        const m = idx >= 0 ? state.seqCtrl.moves[idx] : null;
        $('#mcName').textContent = m ? m.name : '收势 · 预备式';
        $('#mcDesc').textContent = m ? m.desc : '起落归于跨立';
      }
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function stopSeqLoop() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }

  // 退出套路模式（用户回到普通选角色 / 动作时调用）
  function exitSequence() {
    if (!state.seqMode) return;
    stopSeqLoop();
    state.seqMode = false; state.seqCtrl = null;
    $('#moveCaption').hidden = true;
    document.querySelectorAll('#moveList .move-li').forEach((el) => el.classList.remove('active'));
  }

  // ---------- 预览 ----------
  function renderPreview() {
    exitSequence();
    const box = $('#previewRig');
    if (state.preview) state.preview.__anims.forEach((a) => a.cancel()); // 换角色前取消旧无限动画，防泄漏
    box.innerHTML = '';
    state.preview = RigSystem.mount(box, state.character);
    RigSystem.play(state.preview, [...state.motions], { speed: state.speed, intensity: state.intensity });
    state.paused = false;
    $('#playBtn').textContent = '⏸ 暂停';
    applyJoints(state.preview);
    updateJson();
  }

  // ---------- JSON 契约面板 ----------
  function currentConfig() {
    if (state.seqMode && state.seqCtrl) {
      return {
        mode: 'sequence',
        character: 'wushu',
        sequence: state.seqCtrl.sequence.id,
        speed: +state.speed,
        moves: state.seqCtrl.moves.map((m) => m.name),
      };
    }
    const c = RigSystem.listCharacters().find((x) => x.id === state.character);
    return {
      character: state.character,
      motion: [...state.motions],
      intensity: +state.intensity,
      speed: +state.speed,
      title: '（在这里填标题）',
      subtitleZh: '（中文字幕）',
      subtitleEn: '(English caption)',
      _hint: c ? c.name + ' · ' + [...state.motions].length + ' 个动作叠加' : '',
    };
  }
  function highlight(json) {
    return json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="n">$1</span>');
  }
  function updateJson() {
    $('#jsonOut').innerHTML = highlight(JSON.stringify(currentConfig(), null, 2));
  }

  // 重新挂动作（不重建角色 SVG，比 renderPreview 更轻；用于改动作/幅度）
  function replay() {
    exitSequence();
    if (!state.preview) return;
    RigSystem.play(state.preview, [...state.motions], { speed: state.speed, intensity: state.intensity });
    state.paused = false; $('#playBtn').textContent = '⏸ 暂停';
    applyJoints(state.preview);
    updateJson();
  }

  // ---------- 整体刷新 ----------
  function refresh() {
    document.querySelectorAll('.char-chip').forEach((el) =>
      el.classList.toggle('active', el.dataset.id === state.character));
    renderPreview();
  }

  // ---------- 成片场景区 ----------
  function buildScenes() {
    const grid = $('#sceneGrid');
    grid.innerHTML = '';
    (window.RIG_SCENES || []).forEach((cfg) => {
      const card = document.createElement('div');
      card.className = 'scene-card';
      const frame = document.createElement('div');
      frame.className = 'frame';
      card.appendChild(frame);
      RigSystem.renderScene(cfg, frame);
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = '角色 ' + cfg.character + ' · 动作 [' + cfg.motion.join(', ') + ']'
        + (cfg.theme === 'dark' ? ' · 深色' : '');
      card.appendChild(cap);
      grid.appendChild(card);
    });
  }

  // ---------- 控件绑定 ----------
  function bindControls() {
    $('#speed').addEventListener('input', (e) => {
      state.speed = +e.target.value; $('#speedVal').textContent = state.speed.toFixed(2) + '×';
      if (state.preview) state.preview.__anims.forEach((a) => { a.playbackRate = state.speed; }); // 实时变速，不重启
      updateJson();
    });
    $('#intensity').addEventListener('input', (e) => {
      state.intensity = +e.target.value; $('#intensityVal').textContent = state.intensity.toFixed(2) + '×';
      replay(); // 幅度改变需按新值重算 keyframes
    });
    $('#playBtn').addEventListener('click', () => {
      if (!state.preview) return;
      state.paused = !state.paused;
      state.preview.__anims.forEach((a) => state.paused ? a.pause() : a.play());
      $('#playBtn').textContent = state.paused ? '▶ 播放' : '⏸ 暂停';
    });
    $('#resetBtn').addEventListener('click', () => {
      state.motions = new Set(['idle-breathe']); state.speed = 1; state.intensity = 1;
      $('#speed').value = 1; $('#speedVal').textContent = '1.00×';
      $('#intensity').value = 1; $('#intensityVal').textContent = '1.00×';
      buildMotionList(); renderPreview();
    });
    $('#jointsToggle').addEventListener('change', (e) => {
      state.showJoints = e.target.checked; applyJoints(state.preview);
    });
  }

  function init() {
    buildCharChips();
    buildMotionList();
    buildSeqPanel();
    bindControls();
    renderPreview();
    buildScenes();
  }

  window.App = { init, state };
})();
