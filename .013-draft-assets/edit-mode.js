/* edit-mode.js — 浏览器内 overlay 微调编辑器
 *
 * 痛点：作者已经知道 overlay 大概在哪、内容也定了，只想就着浏览器拖一拖、改个颜色、
 * 改个字，然后让磁盘上的 episode.json 跟着变；不想为每次 ±0.5% 都跑一趟 Claude。
 *
 * 交互（按 E 切入 / 切出）：
 *   - 切入时：暂停播放；把当前 scene 的所有 overlay 重新以 edit 模式渲染
 *     （跳过 at.match 延后入场与 enter 动效），叠一层半透明 ring 提示可选
 *   - 鼠标点 overlay → 选中（蓝色 ring）
 *   - 鼠标拖 overlay → 实时改 pos.x/y（按 scene 元素 % 计算）
 *   - 方向键 ±0.5% / Shift+方向键 ±2% / Alt+方向键 ±0.1%（毫毛级）
 *   - "[" / "]" → 上一个 / 下一个 *带 overlay* 的 scene
 *   - Esc → 取消选中（仍在编辑模式）；再 E → 退出编辑模式
 *   - 任何改动塞进 dirty buffer；inspector 提供 Save 按钮，POST 到 edit-server.py
 *
 * 暴露 window.__editMode 给 inspector.jsx：
 *   isActive() / enter() / exit()
 *   getCurrentSceneId() / setSceneId(id) / getSceneIdsWithOverlays()
 *   getSelected() → {sceneId, index, def, merged}
 *   select(sceneId, index) / deselect()
 *   apply(patch)               把 patch 合并到当前选中 overlay（live + dirty）
 *   getDirty()                 列出所有未保存改动
 *   getDirtyCount()
 *   resetSelectedToDisk()      撤回当前 overlay 的本地修改
 *   save() → Promise<{touched}>
 *   onChange(cb) → unsubscribe 把任何状态变化（选中、scene 切换、apply、save）回调出去
 */
(function () {
  if (window.__editMode) return;

  const EP = window.EPISODE;
  if (!EP) { console.error('edit-mode: EPISODE missing'); return; }

  const STYLE_CSS = `
    /* 编辑模式下隐掉黑色控制条（.controls） —— 它的功能（播放/快进/录制/速率）
       在编辑场景里都用不上；要导航就按 E 退出编辑模式。
       注意：跳 beat 已经通过 inspector 的场景选择器 + [/] 快捷键覆盖了，
       per-beat 精度的播放控制在编辑期不需要。 */
    body.edit-mode .controls { display: none; }
    /* 原 Tweaks 面板（不是 inspector）淡出 + 移到左下，腾出右下给 inspector。
       注意：不能给 pointer-events:none，否则 :hover 也接不到鼠标，永远唤不醒。
       opacity:.35 + transition 让它静默时退到背景；hover/focus 时直接到 100%。 */
    body.edit-mode #inspector-mount ~ .twk-panel,
    body.edit-mode .twk-panel:not(#inspector-mount .twk-panel) {
      left: 16px; right: auto;
      opacity: .35;
      transition: opacity .15s;
    }
    body.edit-mode .twk-panel:not(#inspector-mount .twk-panel):hover,
    body.edit-mode .twk-panel:not(#inspector-mount .twk-panel):focus-within {
      opacity: 1;
    }
    /* inspector 自己永远 100% 不透明 + 强制右下角 + 顶到最上层 */
    #inspector-mount .twk-panel {
      opacity: 1 !important; pointer-events: auto !important;
      right: 16px !important; left: auto !important; bottom: 16px !important;
      z-index: 2147483646;
      width: 320px;
    }
    /* 关键：正常播放时 .overlay-layer 是 pointer-events:none，事件穿过去。
       编辑模式让 layer 仍透明但每个 overlay 自己接收事件；
       同时强制 opacity:1，覆盖未播放时的 opacity:0 入场起点。 */
    body.edit-mode .scene-overlay {
      pointer-events: auto !important;
      opacity: 1 !important;
      animation: none !important;
      cursor: grab;
      outline: 1px dashed rgba(0,120,255,.35);
      outline-offset: 2px;
      touch-action: none;
    }
    body.edit-mode .scene-overlay:hover { outline: 2px solid rgba(0,120,255,.7); }
    /* hover 图片容器时给手型，提示这块也是可点击/可操作区域 */
    body.edit-mode .scene image-slot:hover { cursor: pointer; }
    body.edit-mode .scene-overlay.em-selected { outline: 2px solid #0a84ff; outline-offset: 3px; box-shadow: 0 0 0 6px rgba(10,132,255,.18); cursor: grabbing; }
    body.edit-mode .em-toast {
      position: fixed; left: 50%; top: 16px; transform: translateX(-50%);
      background: rgba(0,0,0,.78); color: #fff; padding: 6px 12px;
      border-radius: 8px; font: 12px/1.4 ui-sans-serif,system-ui,sans-serif;
      z-index: 2147483647; pointer-events: none;
      transition: opacity .25s; opacity: 1;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.dataset.editMode = 'true';
  styleEl.textContent = STYLE_CSS;
  document.head.appendChild(styleEl);

  // dirty[sceneId+'#'+index] = patch（深合并的累积）
  const dirty = new Map();
  let active = false;
  let currentSceneId = null;
  let selection = null; // { sceneId, index, el }
  const listeners = new Set();
  const notify = () => listeners.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });

  function toast(msg, ms) {
    const t = document.createElement('div');
    t.className = 'em-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; }, ms || 1400);
    setTimeout(() => t.remove(), (ms || 1400) + 400);
  }

  function deepMerge(dst, patch) {
    if (!dst || typeof dst !== 'object') return JSON.parse(JSON.stringify(patch));
    if (!patch || typeof patch !== 'object') return patch;
    const out = Array.isArray(dst) ? dst.slice() : Object.assign({}, dst);
    for (const k of Object.keys(patch)) {
      const v = patch[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = deepMerge(out[k], v);
      } else {
        out[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
      }
    }
    return out;
  }

  function sceneIdsWithOverlays() {
    const scenes = EP.scenes || {};
    return Object.keys(scenes).filter((id) => Array.isArray(scenes[id].overlays) && scenes[id].overlays.length > 0);
  }

  function currentBeatSceneId() {
    // 从 player 拿当前 beat 的 scene；没有就退到第一个有 overlay 的 scene
    const beats = (window.__player && window.__player.beats) || [];
    const activeEl = document.querySelector('.scene.active');
    if (activeEl && activeEl.dataset.sceneId) return activeEl.dataset.sceneId;
    if (beats.length) return beats[0].scene;
    return sceneIdsWithOverlays()[0] || null;
  }

  function sceneElOf(sceneId) {
    return (window.__player && window.__player.sceneNodes && window.__player.sceneNodes[sceneId]) || null;
  }

  // 合并后的 overlay 定义 = 原盘 + dirty patch
  function mergedOverlay(sceneId, index) {
    const base = (EP.scenes[sceneId] && EP.scenes[sceneId].overlays || [])[index];
    if (!base) return null;
    const patch = dirty.get(sceneId + '#' + index);
    return patch ? deepMerge(base, patch) : JSON.parse(JSON.stringify(base));
  }

  function renderSceneEdit(sceneId) {
    const sceneEl = sceneElOf(sceneId);
    if (!sceneEl) return;
    const base = (EP.scenes[sceneId] && EP.scenes[sceneId].overlays) || [];
    const merged = base.map((_, i) => mergedOverlay(sceneId, i));
    window.__overlays.renderInto(sceneEl, merged, { edit: true });
    // 标 dirty 节点
    sceneEl.querySelectorAll(':scope > .overlay-layer > .scene-overlay').forEach((el) => {
      const idx = Number(el.dataset.overlayIndex);
      if (dirty.has(sceneId + '#' + idx)) el.classList.add('em-dirty');
    });
    wireOverlayPointers(sceneEl);
    // 重新挂选中态
    if (selection && selection.sceneId === sceneId) {
      const sel = sceneEl.querySelector(
        '.scene-overlay[data-overlay-index="' + selection.index + '"]'
      );
      if (sel) { selection.el = sel; sel.classList.add('em-selected'); }
      else { selection = null; }
    }
  }

  function activateScene(sceneId) {
    if (!sceneId) return;
    const nodes = (window.__player && window.__player.sceneNodes) || {};
    Object.keys(nodes).forEach((id) => nodes[id].classList.toggle('active', id === sceneId));
    currentSceneId = sceneId;
    renderSceneEdit(sceneId);
    notify();
  }

  function select(sceneId, index) {
    if (selection && selection.el) selection.el.classList.remove('em-selected');
    if (sceneId == null) { selection = null; notify(); return; }
    if (currentSceneId !== sceneId) activateScene(sceneId);
    const sceneEl = sceneElOf(sceneId);
    const el = sceneEl && sceneEl.querySelector(
      '.scene-overlay[data-overlay-index="' + index + '"]'
    );
    if (!el) { selection = null; notify(); return; }
    el.classList.add('em-selected');
    selection = { sceneId, index, el };
    notify();
  }

  function apply(patch) {
    if (!selection || !patch) return;
    const key = selection.sceneId + '#' + selection.index;
    const prev = dirty.get(key) || {};
    const next = deepMerge(prev, patch);
    dirty.set(key, next);
    // live update DOM
    window.__overlays.updateLive(sceneElOf(selection.sceneId), selection.index, patch);
    selection.el.classList.add('em-dirty');
    notify();
    scheduleAutoSave();
  }

  // auto-save：每次 apply 后 300ms debounce 触发 save()。仅 localhost 生效。
  // 拖动连发的 patch 会在静止时一次写盘；线上 ncds.cc 不存在端点，直接 no-op。
  const IS_LOCAL_HOST = (() => {
    const h = location.hostname;
    return h === '127.0.0.1' || h === 'localhost' || h === '0.0.0.0';
  })();
  let _autoSaveTimer = null;
  function scheduleAutoSave() {
    if (!IS_LOCAL_HOST) return;
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
      _autoSaveTimer = null;
      if (dirty.size === 0) return;
      save({ silent: true }).catch((e) => console.warn('[edit-mode] auto-save failed:', e.message));
    }, 300);
  }

  function resetSelectedToDisk() {
    if (!selection) return;
    const key = selection.sceneId + '#' + selection.index;
    if (!dirty.has(key)) return;
    dirty.delete(key);
    // 重新渲染当前 scene 让该 overlay 回到磁盘形态
    const sid = selection.sceneId;
    const idx = selection.index;
    renderSceneEdit(sid);
    select(sid, idx);
  }

  // ── 鼠标拖拽 ─────────────────────────────────────────────
  function wireOverlayPointers(sceneEl) {
    const els = sceneEl.querySelectorAll(':scope > .overlay-layer > .scene-overlay');
    els.forEach((el) => {
      el.addEventListener('pointerdown', onPointerDown);
    });
  }

  let drag = null; // { startX, startY, startPosX, startPosY, sceneRect, sceneId, index, el, moved }
  function onPointerDown(e) {
    if (!active) return;
    if (e.button !== 0) return;
    const el = e.currentTarget;
    const sceneId = el.dataset.sceneId;
    const index = Number(el.dataset.overlayIndex);
    const sceneEl = sceneElOf(sceneId);
    if (!sceneEl) return;
    select(sceneId, index);
    const m = mergedOverlay(sceneId, index);
    const startPosX = (m.pos && m.pos.x != null) ? m.pos.x : (m.xPct != null ? m.xPct : 50);
    const startPosY = (m.pos && m.pos.y != null) ? m.pos.y : (m.yPct != null ? m.yPct : 50);
    drag = {
      startX: e.clientX, startY: e.clientY,
      startPosX, startPosY,
      sceneRect: sceneEl.getBoundingClientRect(),
      sceneId, index, el, moved: false,
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }
  function onPointerMove(e) {
    if (!drag) return;
    const dxPct = (e.clientX - drag.startX) / drag.sceneRect.width * 100;
    const dyPct = (e.clientY - drag.startY) / drag.sceneRect.height * 100;
    if (Math.abs(dxPct) + Math.abs(dyPct) < 0.05) return;
    drag.moved = true;
    let nx = drag.startPosX + dxPct;
    let ny = drag.startPosY + dyPct;
    // Shift = 0.5% 网格吸附；默认 0.5% 精度（一位小数显示）
    const step = e.shiftKey ? 5 : 0.5;
    nx = Math.round(nx / step) * step;
    ny = Math.round(ny / step) * step;
    nx = Math.max(0, Math.min(100, nx));
    ny = Math.max(0, Math.min(100, ny));
    apply({ pos: { x: round1(nx), y: round1(ny) } });
  }
  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    if (drag && drag.el) {
      try { drag.el.releasePointerCapture && drag.el.releasePointerCapture; } catch (_) {}
    }
    drag = null;
  }
  function round1(n) { return Math.round(n * 10) / 10; }

  // ── 键盘 ─────────────────────────────────────────────
  function isTypingTarget(t) {
    if (!t) return false;
    const tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }

  document.addEventListener('keydown', (e) => {
    // 进 / 出编辑模式（任何上下文，但不抢输入框）
    if ((e.key === 'e' || e.key === 'E') && !isTypingTarget(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      active ? exit() : enter();
      return;
    }
    if (!active) return;
    if (isTypingTarget(e.target)) return;

    if (e.key === 'Escape') {
      if (selection) { select(null); return; }
      exit();
      return;
    }

    // scene 翻页
    if (e.key === '[' || e.key === ']') {
      const ids = sceneIdsWithOverlays();
      if (!ids.length) return;
      const cur = ids.indexOf(currentSceneId);
      const next = e.key === ']' ? (cur + 1) % ids.length : (cur - 1 + ids.length) % ids.length;
      activateScene(ids[next]);
      return;
    }

    // 方向键微调（仅当有选中）
    if (selection && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 2 : (e.altKey ? 0.1 : 0.5);
      const m = mergedOverlay(selection.sceneId, selection.index);
      let x = (m.pos && m.pos.x != null) ? m.pos.x : (m.xPct != null ? m.xPct : 50);
      let y = (m.pos && m.pos.y != null) ? m.pos.y : (m.yPct != null ? m.yPct : 50);
      if (e.key === 'ArrowLeft')  x -= step;
      if (e.key === 'ArrowRight') x += step;
      if (e.key === 'ArrowUp')    y -= step;
      if (e.key === 'ArrowDown')  y += step;
      apply({ pos: { x: round1(x), y: round1(y) } });
      return;
    }

    // Ctrl/Cmd+S 保存
    if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      save().catch((err) => toast('Save failed: ' + err.message, 3000));
    }
  });

  // 点击空白处反选（点 .scene 而不是 overlay）
  document.addEventListener('click', (e) => {
    if (!active) return;
    if (e.target.closest('.scene-overlay')) return;
    if (e.target.closest('.twk-panel')) return;
    if (e.target.closest('.em-toast')) return;
    if (selection) select(null);
  });

  // ── 进 / 出编辑模式 ─────────────────────────────────────
  function enter() {
    if (active) return;
    active = true;
    document.body.classList.add('edit-mode');
    if (window.__player && window.__player.pause) window.__player.pause();
    // 默认 scene = 当前 active；若 active 没 overlay，跳到第一个有 overlay 的
    const startSid = currentBeatSceneId();
    const withOv = sceneIdsWithOverlays();
    const sid = (withOv.indexOf(startSid) >= 0) ? startSid : (withOv[0] || startSid);
    activateScene(sid);
    toast('编辑模式  ·  E 退出  ·  [ ] 切场景  ·  方向键微调', 2200);
  }

  function exit() {
    if (!active) return;
    if (dirty.size > 0) {
      const ok = confirm(`有 ${dirty.size} 项未保存改动，确认退出并丢弃？`);
      if (!ok) return;
      dirty.clear();
    }
    active = false;
    selection = null;
    document.body.classList.remove('edit-mode');
    // 让 player 重新按 onBeat 流程恢复当前 scene
    if (window.__player && window.__player.showBeat) {
      const beats = window.__player.beats || [];
      let i = beats.findIndex((b) => b.scene === currentSceneId);
      if (i < 0) i = 0;
      window.__player.showBeat(i);
    }
    notify();
  }

  // ── 保存 ─────────────────────────────────────
  async function save(opts) {
    const silent = !!(opts && opts.silent);
    if (dirty.size === 0) { if (!silent) toast('没有改动'); return { touched: 0 }; }
    const patches = [];
    dirty.forEach((patch, key) => {
      const [sceneId, idxStr] = key.split('#');
      patches.push({ scene: sceneId, index: Number(idxStr), patch });
    });
    const slug = EP.__slug || (EP.meta && EP.meta.slug);
    const res = await fetch('/__save_overlays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, patches }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    const body = await res.json();
    // 把 dirty 落到 EP 内存里，清 dirty buffer，重渲当前 scene
    dirty.forEach((patch, key) => {
      const [sceneId, idxStr] = key.split('#');
      const idx = Number(idxStr);
      const ov = EP.scenes[sceneId].overlays[idx];
      EP.scenes[sceneId].overlays[idx] = deepMerge(ov, patch);
    });
    dirty.clear();
    if (currentSceneId) renderSceneEdit(currentSceneId);
    notify();
    if (!silent) toast(`已保存 ${body.touched} 项`);
    return body;
  }

  // 新增一个 overlay：POST /__add_overlay → 服务端 append + 写盘，返回新 index
  // 客户端把同样的 overlay 推进 EP 内存，重渲当前 scene 并选中新项
  // 失败回退（不动 EP），用户看到错误 toast 即可
  async function addOverlay(sceneId, overlay) {
    sceneId = sceneId || currentSceneId;
    if (!sceneId) return null;
    const o = overlay || { text: '新文字', pos: { x: 50, y: 50 } };
    const slug = EP.__slug || (EP.meta && EP.meta.slug);
    try {
      const res = await fetch('/__add_overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, scene: sceneId, overlay: o }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const body = await res.json();
      const idx = body.index;
      // 同步 EP 内存
      if (!Array.isArray(EP.scenes[sceneId].overlays)) EP.scenes[sceneId].overlays = [];
      EP.scenes[sceneId].overlays.push(JSON.parse(JSON.stringify(o)));
      // 重渲 + 选中
      if (currentSceneId === sceneId) renderSceneEdit(sceneId);
      else activateScene(sceneId);
      select(sceneId, idx);
      return idx;
    } catch (e) {
      toast('新增失败：' + e.message, 2400);
      console.warn('[edit-mode] addOverlay failed:', e);
      return null;
    }
  }

  // ── 暴露给 inspector ─────────────────────────────────
  window.__editMode = {
    isActive: () => active,
    enter, exit,
    getCurrentSceneId: () => currentSceneId,
    setSceneId: activateScene,
    getSceneIdsWithOverlays: sceneIdsWithOverlays,
    getSelected: () => {
      if (!selection) return null;
      const merged = mergedOverlay(selection.sceneId, selection.index);
      const base = (EP.scenes[selection.sceneId].overlays || [])[selection.index];
      return { sceneId: selection.sceneId, index: selection.index, def: base, merged };
    },
    select,
    deselect: () => select(null),
    apply,
    addOverlay,
    getDirty: () => {
      const out = [];
      dirty.forEach((patch, key) => {
        const [sceneId, idxStr] = key.split('#');
        out.push({ scene: sceneId, index: Number(idxStr), patch });
      });
      return out;
    },
    getDirtyCount: () => dirty.size,
    isOverlayDirty: (sceneId, index) => dirty.has(sceneId + '#' + index),
    resetSelectedToDisk,
    save,
    onChange: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    // 给 inspector 拿 beat 上下文（at.match 候选 / 文字预览）
    getBeatsForScene: (sceneId) => ((window.__player && window.__player.beats) || []).filter((b) => b.scene === sceneId),
  };
})();
// reload test ping
