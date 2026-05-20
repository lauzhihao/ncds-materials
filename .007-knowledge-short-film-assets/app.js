(function () {
  const ASSET_ROOT = ".007-knowledge-short-film-assets";

  const state = {
    story: null,
    duration: 180,
    fps: 60,
    currentTime: 0,
    isPlaying: false,
    lastTimestamp: 0,
    currentSceneIndex: -1,
    activeScene: null,
    sceneCards: new Map(),
    sceneInternals: new Map()
  };

  const dom = {};

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function formatNumberDisplay(v, target) {
    if (Math.abs(target) >= 100) return String(Math.round(v));
    if (Math.abs(target - Math.round(target)) < 0.05) return String(Math.round(v));
    return v.toFixed(1);
  }

  function el(tag, cls) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function wrapInRich(element, term, classes, dataTarget) {
    if (!term || !element) return null;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      const idx = textNode.nodeValue.indexOf(term);
      if (idx < 0) continue;
      const before = textNode.nodeValue.slice(0, idx);
      const after = textNode.nodeValue.slice(idx + term.length);
      const span = document.createElement("span");
      span.className = classes;
      span.textContent = term;
      span.dataset.target = dataTarget || term;
      const parent = textNode.parentNode;
      if (before) parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(span, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);
      if (classes.includes("hl-underlinedraw")) {
        const bar = document.createElement("span");
        bar.className = "hl-underline-bar";
        span.appendChild(bar);
      }
      return span;
    }
    return null;
  }

  function buildHighlights(scene, ...elements) {
    const map = new Map();
    if (scene.highlight) {
      map.set(scene.highlight, new Set(["hl", "hl-main"]));
    }
    (scene.beats || []).forEach((beat) => {
      if (typeof beat.target !== "string") return;
      if (!map.has(beat.target)) map.set(beat.target, new Set(["hl"]));
      map.get(beat.target).add(`hl-${beat.type.toLowerCase()}`);
    });
    map.forEach((classes, term) => {
      for (const target of elements) {
        if (!target) continue;
        if (wrapInRich(target, term, Array.from(classes).join(" "), term)) break;
      }
    });
  }

  async function loadStory() {
    const res = await fetch(`${ASSET_ROOT}/story.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load story: ${res.status}`);
    state.story = await res.json();
    state.duration = Number(state.story.meta.duration) || 180;
    state.fps = Number(state.story.meta.fps) || 60;
  }

  function cacheDom() {
    const ids = [
      "videoStage", "mainStage", "mastheadPub", "mastheadIssue", "mastheadSpec",
      "folioPage", "folioTime",
      "playPauseButton", "restartButton", "cleanModeButton", "openCleanButton",
      "timelineInput", "playbackState", "renderSpec", "totalFrameCount",
      "exportCommand", "fastExportCommand", "framesExportCommand",
      "copyExportCommandButton", "copyFastExportCommandButton", "copyFramesExportCommandButton",
      "openFrameButton",
      "sceneList", "sceneCounter", "voiceoverCopy",
      "controlTitle", "controlSubtitle",
      "progressFill"
    ];
    ids.forEach((id) => { dom[id] = document.getElementById(id); });
  }

  function renderMasthead() {
    const m = state.story.meta;
    if (dom.mastheadPub) dom.mastheadPub.textContent = m.publication;
    if (dom.mastheadIssue) dom.mastheadIssue.textContent = `${m.edition} · ${m.issueDate}`;
    if (dom.mastheadSpec) dom.mastheadSpec.textContent = m.outputSpec;
  }

  function buildSceneCards() {
    dom.mainStage.innerHTML = "";
    state.story.scenes.forEach((scene) => {
      const card = el("div", `scene-card layout-${scene.layout}`);
      card.dataset.sceneId = scene.id;
      const internals = {};
      switch (scene.layout) {
        case "headline":   buildHeadline(card, scene, internals); break;
        case "numbers":    buildNumbers(card, scene, internals);  break;
        case "compare":    buildCompare(card, scene, internals);  break;
        case "chart":      buildChart(card, scene, internals);    break;
        case "diagram":    buildDiagram(card, scene, internals);  break;
        case "quote":      buildQuote(card, scene, internals);    break;
        case "bigword":    buildBigword(card, scene, internals);    break;
        case "bignumber":  buildBignumber(card, scene, internals);  break;
        case "phraseflow": buildPhraseflow(card, scene, internals); break;
        case "chartonly":  buildChartonly(card, scene, internals);  break;
        default: card.textContent = `Unknown layout: ${scene.layout}`;
      }
      dom.mainStage.appendChild(card);
      state.sceneCards.set(scene.id, card);
      state.sceneInternals.set(scene.id, internals);
    });
  }

  function buildHeadline(card, scene, internals) {
    const kicker = el("div", "headline-kicker");
    kicker.textContent = scene.kicker || "";
    const title = el("h1", "headline-title");
    title.textContent = scene.headline || "";
    const sub = el("p", "headline-sub");
    sub.textContent = scene.sub || "";
    card.append(kicker, title, sub);
    let ornament = null;
    if (scene.ornament) {
      ornament = el("p", "headline-ornament");
      ornament.textContent = scene.ornament;
      card.appendChild(ornament);
    }
    buildHighlights(scene, title, sub);
    internals.ornament = ornament;
  }

  function buildNumbers(card, scene, internals) {
    const head = el("div", "numbers-head");
    const h2 = el("h2");
    h2.textContent = scene.headline || "";
    const sub = el("p", "sub");
    sub.textContent = scene.sub || "";
    head.append(h2, sub);

    const grid = el("div", "numbers-grid");
    internals.numberRefs = [];
    (scene.numbers || []).forEach((num, i) => {
      const cell = el("div", "number-card");
      if (num.accent) cell.classList.add("is-accent");
      const idx = el("div", "idx");
      idx.textContent = `N${String(i + 1).padStart(2, "0")}`;
      const display = el("div", "number-display");
      const prefix = el("span", "prefix");
      prefix.textContent = num.prefix || "";
      const value = el("span", "value");
      value.textContent = "0";
      const suffix = el("span", "suffix");
      suffix.textContent = num.suffix || "";
      display.append(prefix, value, suffix);
      const label = el("p", "number-label");
      label.textContent = num.label || "";
      const note = el("p", "number-note");
      note.textContent = num.note || "";
      cell.append(idx, display, label, note);
      grid.appendChild(cell);
      internals.numberRefs.push({ valueSpan: value, target: Number(num.value) || 0 });
    });

    card.append(head, grid);
  }

  function buildCompare(card, scene, internals) {
    const head = el("div", "compare-head");
    const h2 = el("h2");
    h2.textContent = scene.headline || "";
    const sub = el("p", "sub");
    sub.textContent = scene.sub || "";
    head.append(h2, sub);

    const grid = el("div", "compare-grid");
    const data = scene.compare || {};

    const left = el("div", "compare-col is-old");
    fillCompareCol(left, data.leftKicker, data.leftTitle, data.leftItems || [], data.leftFormula);
    const divider = el("div", "compare-divider");
    const right = el("div", "compare-col is-new");
    fillCompareCol(right, data.rightKicker, data.rightTitle, data.rightItems || [], data.rightFormula);

    buildHighlights(scene, right.querySelector(".compare-formula"));

    grid.append(left, divider, right);
    card.append(head, grid);
    internals.left = left;
    internals.right = right;
  }

  function fillCompareCol(col, kicker, title, items, formula) {
    const k = el("div", "kicker");
    k.textContent = kicker || "";
    const h = el("h3");
    h.textContent = title || "";
    const ul = el("ul");
    items.forEach((text) => {
      const li = el("li");
      const span = el("span");
      span.textContent = text;
      li.appendChild(span);
      ul.appendChild(li);
    });
    const f = el("p", "compare-formula");
    f.textContent = formula || "";
    col.append(k, h, ul, f);
  }

  function buildChart(card, scene, internals) {
    const side = el("div", "chart-side");
    const kicker = el("div", "kicker");
    kicker.textContent = scene.kicker || "";
    const h2 = el("h2");
    h2.textContent = scene.headline || "";
    const sub = el("p", "sub");
    sub.textContent = scene.sub || "";
    const caption = el("p", "caption");
    caption.textContent = scene.caption || "";
    side.append(kicker, h2, sub, caption);

    const area = el("div", "chart-area");
    const items = scene.chart?.items || [];
    const max = Math.max(...items.map((it) => Number(it.value) || 0), 1);

    const unit = el("div", "chart-unit");
    const unitL = el("span");
    unitL.textContent = scene.chart?.unit || "";
    const unitR = el("span");
    unitR.textContent = `MAX ${max}`;
    unit.append(unitL, unitR);

    const bars = el("div", "chart-bars");
    bars.style.gridTemplateRows = `repeat(${items.length}, minmax(0, 1fr))`;
    internals.barRefs = [];
    items.forEach((item) => {
      const row = el("div", "chart-row");
      if (item.highlight) row.classList.add("is-highlight");
      const label = el("div", "row-label");
      label.textContent = item.label || "";
      const track = el("div", "row-track");
      const fill = el("div", "row-fill");
      track.appendChild(fill);
      const value = el("div", "row-value");
      value.textContent = String(item.value);
      row.append(label, track, value);
      bars.appendChild(row);
      internals.barRefs.push({
        row, fill, value,
        targetPct: (Number(item.value) / max) * 100
      });
    });

    if (scene.chart?.safeLine != null) {
      const safeLine = el("div", "chart-safe-line");
      safeLine.style.left = `calc(${(scene.chart.safeLine / max) * 100}% )`;
      safeLine.dataset.label = scene.chart.safeLineLabel || "";
      bars.appendChild(safeLine);
      internals.safeLine = safeLine;
    }

    const foot = el("div", "chart-foot");
    const footL = el("span");
    footL.textContent = "低 ←";
    const footR = el("span");
    footR.textContent = "→ 高";
    foot.append(footL, footR);

    area.append(unit, bars, foot);
    card.append(side, area);
  }

  function buildDiagram(card, scene, internals) {
    const head = el("div", "diagram-head");
    const h2 = el("h2");
    h2.textContent = scene.headline || "";
    const sub = el("p", "sub");
    sub.textContent = scene.sub || "";
    head.append(h2, sub);

    const body = el("div", "diagram-body");
    internals.nodeRefs = new Map();
    (scene.diagram?.nodes || []).forEach((node, i) => {
      const n = el("div", "diagram-node");
      n.dataset.nodeId = node.id;
      const num = el("div", "num");
      num.textContent = `0${i + 1}`;
      const h3 = el("h3");
      h3.textContent = node.title || "";
      const metric = el("div", "metric");
      metric.textContent = node.metric || "";
      const ml = el("div", "metric-label");
      ml.textContent = node.metricLabel || "";
      const delta = el("div", "delta");
      delta.textContent = node.delta || "";
      const detail = el("p", "detail");
      detail.textContent = node.detail || "";
      n.append(num, h3, metric, ml, delta, detail);
      body.appendChild(n);
      internals.nodeRefs.set(node.id, n);
    });

    card.append(head, body);
  }

  function buildQuote(card, scene, internals) {
    const head = el("div", "quote-head");
    const k = el("div", "kicker");
    k.textContent = scene.kicker || "";
    const h2 = el("h2");
    h2.textContent = scene.sub || scene.headline || "";
    head.append(k, h2);

    const body = el("div", "quote-body");
    const openMark = el("div", "quote-mark");
    openMark.textContent = scene.quote?.open || "“";
    const lines = el("div", "quote-lines");
    internals.lineRefs = [];
    (scene.quote?.lines || []).forEach((text) => {
      const line = el("p", "quote-line");
      line.textContent = text;
      lines.appendChild(line);
      internals.lineRefs.push(line);
    });
    const closeMark = el("div", "quote-mark right");
    closeMark.textContent = scene.quote?.close || "”";
    body.append(openMark, lines, closeMark);

    const attr = el("p", "quote-attribution");
    attr.textContent = scene.quote?.attribution || "";
    internals.attribution = attr;

    card.append(head, body, attr);
  }

  function buildBigword(card, scene, internals) {
    if (scene.kicker) {
      const kicker = el("p", "bigword-kicker");
      kicker.textContent = scene.kicker;
      card.appendChild(kicker);
    }
    const shell = el("div", "bigword-shell");
    const size = scene.size || "large";
    const text = el("h2", `bigword-text size-${size}`);
    text.textContent = scene.text || "";
    if (scene.style === "accent" || scene.style === "strike" || scene.style === "underline" || scene.style === "circle" || scene.style === "question") {
      // accent: red color; others: keep ink color but apply decoration
    }
    if (scene.style === "accent") text.classList.add("is-accent");
    shell.appendChild(text);

    const wantStrike = scene.style === "strike" || (scene.beats || []).some((b) => b.type === "strikethrough");
    if (wantStrike) {
      const strike = el("span", "bigword-strike-bar");
      shell.appendChild(strike);
      internals.strikeBar = strike;
    }
    const wantUnderline = scene.style === "underline" || (scene.beats || []).some((b) => b.type === "underline");
    if (wantUnderline) {
      const bar = el("span", "bigword-underline-bar");
      shell.appendChild(bar);
      internals.underlineBar = bar;
    }
    const wantCircle = scene.style === "circle" || (scene.beats || []).some((b) => b.type === "circle");
    if (wantCircle) {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("class", "bigword-circle");
      svg.setAttribute("viewBox", "0 0 200 100");
      svg.setAttribute("preserveAspectRatio", "none");
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M 38 24 C 60 8 140 6 168 22 C 192 34 194 70 172 84 C 140 96 50 96 24 80 C 4 66 6 28 30 16 C 44 12 52 18 58 22");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(path);
      shell.appendChild(svg);
      internals.circlePath = path;
    }
    if (scene.style === "question") {
      const q = el("span", "bigword-question-mark");
      q.textContent = "？";
      text.appendChild(q);
    }

    card.appendChild(shell);

    if (scene.caption) {
      const cap = el("p", "bigword-caption");
      cap.textContent = scene.caption;
      card.appendChild(cap);
    }

    if (scene.ornament) {
      const orn = el("p", "headline-ornament");
      orn.textContent = scene.ornament;
      card.appendChild(orn);
      internals.ornament = orn;
    }

    internals.text = text;
    internals.shell = shell;
  }

  function buildBignumber(card, scene, internals) {
    if (scene.kicker) {
      const kicker = el("p", "bignumber-kicker");
      kicker.textContent = scene.kicker;
      card.appendChild(kicker);
    }
    const row = el("div", "bignumber-row");
    const value = el("span", `bignumber-value${scene.style === "accent" ? " is-accent" : ""}`);
    value.textContent = "0";
    const unit = el("span", "bignumber-unit");
    unit.textContent = scene.unit || "";
    row.append(value, unit);
    card.appendChild(row);

    if (scene.caption) {
      const cap = el("p", "bignumber-caption");
      cap.textContent = scene.caption;
      card.appendChild(cap);
    }

    internals.numberRefs = [{ valueSpan: value, target: Number(scene.value) || 0 }];
    internals.shell = row;
  }

  function buildPhraseflow(card, scene, internals) {
    if (scene.kicker) {
      const k = el("p", "bigword-kicker");
      k.textContent = scene.kicker;
      card.appendChild(k);
    }
    const list = el("div", "phraseflow-list");
    internals.phraseItems = [];
    (scene.phrases || []).forEach((phrase, i) => {
      if (i > 0) {
        const arrow = el("div", "phraseflow-arrow");
        arrow.textContent = scene.arrow || "↓";
        list.appendChild(arrow);
        internals.phraseItems.push(arrow);
      }
      const p = el("p", "phraseflow-item");
      const text = typeof phrase === "string" ? phrase : phrase.text;
      p.textContent = text;
      if (typeof phrase === "object" && phrase.accent) p.classList.add("is-accent");
      list.appendChild(p);
      internals.phraseItems.push(p);
    });
    card.appendChild(list);

    if (scene.footnote) {
      const foot = el("p", "phraseflow-footnote");
      foot.textContent = scene.footnote;
      card.appendChild(foot);
      internals.phraseFootnote = foot;
    }
  }

  function buildChartonly(card, scene, internals) {
    if (scene.kicker) {
      const k = el("p", "chartonly-kicker");
      k.textContent = scene.kicker;
      card.appendChild(k);
    }

    const area = el("div", "chart-area");
    const items = scene.chart?.items || [];
    const max = Math.max(...items.map((it) => Number(it.value) || 0), 1);

    const unit = el("div", "chart-unit");
    const unitL = el("span"); unitL.textContent = scene.chart?.unit || "";
    const unitR = el("span"); unitR.textContent = `MAX ${max}`;
    unit.append(unitL, unitR);

    const bars = el("div", "chart-bars");
    bars.style.gridTemplateRows = `repeat(${items.length}, minmax(0, 1fr))`;
    internals.barRefs = [];
    items.forEach((item) => {
      const row = el("div", "chart-row");
      if (item.highlight) row.classList.add("is-highlight");
      const label = el("div", "row-label");
      label.textContent = item.label || "";
      const track = el("div", "row-track");
      const fill = el("div", "row-fill");
      track.appendChild(fill);
      const value = el("div", "row-value");
      value.textContent = String(item.value);
      row.append(label, track, value);
      bars.appendChild(row);
      internals.barRefs.push({
        row, fill, value,
        targetPct: (Number(item.value) / max) * 100
      });
    });

    if (scene.chart?.safeLine != null) {
      const safeLine = el("div", "chart-safe-line");
      safeLine.style.left = `calc(${(scene.chart.safeLine / max) * 100}% )`;
      safeLine.dataset.label = scene.chart.safeLineLabel || "";
      bars.appendChild(safeLine);
      internals.safeLine = safeLine;
    }

    const foot = el("div", "chart-foot");
    const footL = el("span"); footL.textContent = "低 ←";
    const footR = el("span"); footR.textContent = "→ 高";
    foot.append(footL, footR);

    area.append(unit, bars, foot);
    card.appendChild(area);
  }

  function activateScene(index) {
    const scene = state.story.scenes[index];
    if (!scene) return;
    if (state.currentSceneIndex === index) return;

    state.sceneCards.forEach((card, id) => {
      if (id === scene.id) {
        card.classList.add("is-active");
        card.classList.remove("is-leaving");
      } else if (card.classList.contains("is-active")) {
        card.classList.remove("is-active");
        card.classList.add("is-leaving");
        const leavingId = id;
        setTimeout(() => {
          const c = state.sceneCards.get(leavingId);
          if (c && !c.classList.contains("is-active")) c.classList.remove("is-leaving");
        }, 420);
      }
    });

    state.activeScene = scene;
    state.currentSceneIndex = index;

    if (dom.mastheadIssue) {
      dom.mastheadIssue.textContent = `${state.story.meta.edition} · ${scene.chapter || ""}`;
    }
    if (dom.folioPage) dom.folioPage.textContent = `— ${scene.folio || ""} —`;
    if (dom.voiceoverCopy) dom.voiceoverCopy.textContent = scene.voiceover || "";
    if (dom.sceneCounter) {
      dom.sceneCounter.textContent = `${index + 1} / ${state.story.scenes.length}`;
    }

    if (dom.sceneList) {
      Array.from(dom.sceneList.children).forEach((chip, i) => {
        chip.classList.toggle("is-active", i === index);
      });
    }
  }

  function applyShow(element, t, hideOffsetCqh) {
    if (!element) return;
    element.style.opacity = t.toFixed(3);
    element.style.transform = `translateY(${((1 - t) * hideOffsetCqh).toFixed(3)}cqh)`;
  }

  function beatProgress(scene, beat, progress) {
    const dur = beat.duration || 0.1;
    return clamp((progress - beat.at) / dur, 0, 1);
  }

  function applyBeats() {
    const scene = state.activeScene;
    if (!scene) return;
    const dur = scene.end - scene.start;
    const progress = dur > 0 ? clamp((state.currentTime - scene.start) / dur, 0, 1) : 1;
    const card = state.sceneCards.get(scene.id);
    const internals = state.sceneInternals.get(scene.id);
    if (!card || !internals) return;

    const beats = scene.beats || [];

    // Numbers
    if (internals.numberRefs) {
      internals.numberRefs.forEach((ref, i) => {
        const beat = beats.find((b) => b.type === "numberRoll" && (b.targets || []).includes(i));
        if (!beat) {
          ref.valueSpan.textContent = formatNumberDisplay(ref.target, ref.target);
          return;
        }
        const eased = easeOutCubic(beatProgress(scene, beat, progress));
        ref.valueSpan.textContent = formatNumberDisplay(ref.target * eased, ref.target);
      });
    }

    // Compare panels
    ["left", "right"].forEach((side) => {
      const panel = internals[side];
      if (!panel) return;
      const beat = beats.find((b) => b.type === "panelReveal" && b.target === side);
      if (!beat) { applyShow(panel, 1, 0); return; }
      const eased = easeOutCubic(beatProgress(scene, beat, progress));
      applyShow(panel, eased, 1.4);
    });

    // Bars
    if (internals.barRefs) {
      const beat = beats.find((b) => b.type === "barsGrow");
      const n = internals.barRefs.length;
      internals.barRefs.forEach((b, i) => {
        if (!beat) { b.fill.style.width = `${b.targetPct}%`; return; }
        const bDur = beat.duration || 0.1;
        const stagger = (i / Math.max(1, n - 1)) * 0.35;
        const local = clamp((progress - beat.at - stagger * bDur) / (bDur * (1 - 0.35) || 0.01), 0, 1);
        const eased = easeOutCubic(local);
        b.fill.style.width = `${(b.targetPct * eased).toFixed(2)}%`;
      });
    }

    // Safe line
    if (internals.safeLine) {
      const beat = beats.find((b) => b.type === "safeLineDraw");
      if (!beat) internals.safeLine.style.opacity = "0.85";
      else internals.safeLine.style.opacity = String(easeOutCubic(beatProgress(scene, beat, progress)) * 0.85);
    }

    // Diagram nodes
    if (internals.nodeRefs) {
      internals.nodeRefs.forEach((n, id) => {
        const beat = beats.find((b) => b.type === "nodeReveal" && b.target === id);
        if (!beat) { applyShow(n, 1, 0); return; }
        const eased = easeOutCubic(beatProgress(scene, beat, progress));
        applyShow(n, eased, 1);
      });
      const pulseBeat = beats.find((b) => b.type === "centerPulse");
      if (pulseBeat) {
        const bp = beatProgress(scene, pulseBeat, progress);
        const intensity = bp > 0 && bp < 1 ? Math.sin(bp * Math.PI) : 0;
        internals.nodeRefs.forEach((n) => {
          n.style.boxShadow = `0 0 0 ${(1.4 * intensity).toFixed(2)}cqw rgba(196, 54, 31, ${(0.32 * intensity).toFixed(2)})`;
        });
      } else {
        internals.nodeRefs.forEach((n) => { n.style.boxShadow = ""; });
      }
    }

    // Quote lines
    if (internals.lineRefs) {
      internals.lineRefs.forEach((line, i) => {
        const beat = beats.find((b) => b.type === "lineReveal" && b.target === i);
        if (!beat) { applyShow(line, 1, 0); return; }
        const eased = easeOutCubic(beatProgress(scene, beat, progress));
        applyShow(line, eased, 0.8);
      });
    }
    if (internals.attribution) {
      const beat = beats.find((b) => b.type === "attributionFade");
      if (!beat) internals.attribution.style.opacity = "1";
      else internals.attribution.style.opacity = String(easeOutCubic(beatProgress(scene, beat, progress)));
    }

    // Ornament
    if (internals.ornament) {
      const beat = beats.find((b) => b.type === "ornamentFade");
      if (!beat) { applyShow(internals.ornament, 1, 0); }
      else {
        const eased = easeOutCubic(beatProgress(scene, beat, progress));
        applyShow(internals.ornament, eased, 0.6);
      }
    }

    // Bigword shell entry animation (first 0.18 of scene)
    if (internals.shell) {
      const intro = clamp(progress / 0.18, 0, 1);
      const eased = easeOutCubic(intro);
      const s = 0.94 + 0.06 * eased;
      internals.shell.style.transform = `scale(${s.toFixed(3)})`;
      internals.shell.style.opacity = eased.toFixed(3);
    }

    // Bigword strikethrough — drives off "strikethrough" beat OR scene.style==="strike"
    if (internals.strikeBar) {
      let val = 0;
      const strikeBeat = beats.find((b) => b.type === "strikethrough");
      if (strikeBeat) {
        val = easeOutCubic(beatProgress(scene, strikeBeat, progress));
      } else if (scene.style === "strike") {
        val = easeOutCubic(clamp((progress - 0.22) / 0.34, 0, 1));
      }
      internals.strikeBar.style.transform = `scaleX(${val.toFixed(3)})`;
    }

    // Bigword underline (full-phrase, not inline)
    if (internals.underlineBar) {
      let val = 0;
      const ulBeat = beats.find((b) => b.type === "underline");
      if (ulBeat) {
        val = easeOutCubic(beatProgress(scene, ulBeat, progress));
      } else if (scene.style === "underline") {
        val = easeOutCubic(clamp((progress - 0.22) / 0.34, 0, 1));
      }
      internals.underlineBar.style.transform = `scaleX(${val.toFixed(3)})`;
    }

    // Bigword circle (SVG path draw)
    if (internals.circlePath) {
      let val = 0;
      const cBeat = beats.find((b) => b.type === "circle");
      if (cBeat) {
        val = easeOutCubic(beatProgress(scene, cBeat, progress));
      } else if (scene.style === "circle") {
        val = easeOutCubic(clamp((progress - 0.22) / 0.4, 0, 1));
      }
      const len = internals.circlePath.getTotalLength?.() || 600;
      internals.circlePath.style.strokeDasharray = String(len);
      internals.circlePath.style.strokeDashoffset = String(len * (1 - val));
    }

    // Phraseflow staggered reveal
    if (internals.phraseItems) {
      const total = internals.phraseItems.length;
      internals.phraseItems.forEach((item, i) => {
        const stagger = (i / Math.max(1, total - 1)) * 0.42;
        const local = clamp((progress - 0.06 - stagger) / 0.22, 0, 1);
        const eased = easeOutCubic(local);
        item.style.opacity = eased.toFixed(3);
        item.style.transform = `translateY(${((1 - eased) * 0.8).toFixed(2)}cqh)`;
      });
      if (internals.phraseFootnote) {
        const local = clamp((progress - 0.55) / 0.2, 0, 1);
        const eased = easeOutCubic(local);
        internals.phraseFootnote.style.opacity = eased.toFixed(3);
      }
    }

    // Keyword pulse
    const pulseBeats = beats.filter((b) => b.type === "keywordPulse");
    card.querySelectorAll(".hl-keywordpulse").forEach((span) => {
      let scale = 1;
      pulseBeats.forEach((beat) => {
        if (typeof beat.target === "string" && span.dataset.target && span.dataset.target !== beat.target) return;
        const bp = beatProgress(scene, beat, progress);
        if (bp <= 0) return;
        const peak = 0.4;
        let s;
        if (bp < peak) s = 1 + (bp / peak) * 0.12;
        else s = 1.12 - ((bp - peak) / (1 - peak)) * 0.06;
        if (s > scale) scale = s;
      });
      span.style.transform = `scale(${scale.toFixed(3)})`;
    });

    // Underline draw
    const underlineBeats = beats.filter((b) => b.type === "underlineDraw");
    card.querySelectorAll(".hl-underlinedraw .hl-underline-bar").forEach((bar) => {
      const span = bar.parentElement;
      let val = 0;
      underlineBeats.forEach((beat) => {
        if (typeof beat.target === "string" && span.dataset.target && span.dataset.target !== beat.target) return;
        const eased = easeOutCubic(beatProgress(scene, beat, progress));
        if (eased > val) val = eased;
      });
      bar.style.transform = `scaleX(${val.toFixed(3)})`;
    });
  }

  function tick(ts) {
    if (state.isPlaying) {
      if (state.lastTimestamp) {
        const dt = (ts - state.lastTimestamp) / 1000;
        state.currentTime = clamp(state.currentTime + dt, 0, state.duration);
        if (state.currentTime >= state.duration) {
          state.isPlaying = false;
          if (dom.playPauseButton) dom.playPauseButton.textContent = "播放";
          if (dom.playbackState) dom.playbackState.textContent = "结束";
        }
      }
      state.lastTimestamp = ts;
    } else {
      state.lastTimestamp = 0;
    }

    renderClock();
    requestAnimationFrame(tick);
  }

  function renderClock() {
    if (!state.story) return;
    const scenes = state.story.scenes;
    let idx = scenes.findIndex((s) => state.currentTime >= s.start && state.currentTime < s.end);
    if (idx === -1) idx = state.currentTime >= state.duration ? scenes.length - 1 : 0;
    if (idx !== state.currentSceneIndex) activateScene(idx);

    applyBeats();

    if (dom.folioTime) dom.folioTime.textContent = formatTime(state.currentTime);
    if (dom.progressFill) dom.progressFill.style.width = `${(state.currentTime / state.duration) * 100}%`;
    if (dom.timelineInput && document.activeElement !== dom.timelineInput) {
      dom.timelineInput.value = String(state.currentTime);
    }
  }

  function play() {
    state.isPlaying = true;
    state.lastTimestamp = 0;
    if (dom.playPauseButton) dom.playPauseButton.textContent = "暂停";
    if (dom.playbackState) dom.playbackState.textContent = "播放";
  }

  function pause() {
    state.isPlaying = false;
    state.lastTimestamp = 0;
    if (dom.playPauseButton) dom.playPauseButton.textContent = "播放";
    if (dom.playbackState) dom.playbackState.textContent = "暂停";
  }

  function togglePlay() {
    if (state.isPlaying) pause(); else play();
  }

  function seek(time) {
    state.currentTime = clamp(Number(time) || 0, 0, state.duration);
    state.lastTimestamp = 0;
    renderClock();
  }

  function setCleanMode(on) {
    document.body.classList.toggle("clean-mode", !!on);
  }

  function buildSceneList() {
    if (!dom.sceneList) return;
    dom.sceneList.innerHTML = "";
    state.story.scenes.forEach((s, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "scene-chip";
      chip.innerHTML = `<strong>${s.label}</strong><em>${s.layout}</em><span>${formatTime(s.start)}</span>`;
      chip.addEventListener("click", () => {
        seek(s.start);
        pause();
      });
      dom.sceneList.appendChild(chip);
    });
  }

  function bindControls() {
    dom.playPauseButton?.addEventListener("click", togglePlay);
    dom.restartButton?.addEventListener("click", () => { seek(0); pause(); });
    dom.cleanModeButton?.addEventListener("click", () => setCleanMode(!document.body.classList.contains("clean-mode")));
    dom.openCleanButton?.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("clean", "1");
      url.searchParams.set("autoplay", "1");
      window.open(url.toString(), "_blank", "noopener");
    });
    dom.timelineInput?.addEventListener("input", (e) => {
      pause();
      seek(Number(e.target.value));
    });
    [
      ["copyExportCommandButton", "exportCommand"],
      ["copyFastExportCommandButton", "fastExportCommand"],
      ["copyFramesExportCommandButton", "framesExportCommand"]
    ].forEach(([btn, target]) => {
      dom[btn]?.addEventListener("click", () => {
        const text = dom[target]?.textContent || "";
        navigator.clipboard?.writeText(text);
        if (dom[btn]) {
          const orig = dom[btn].textContent;
          dom[btn].textContent = "已复制";
          setTimeout(() => { dom[btn].textContent = orig; }, 1200);
        }
      });
    });
    dom.openFrameButton?.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("clean", "1");
      url.searchParams.set("frame", String(Math.round(state.currentTime * state.fps)));
      url.searchParams.set("fps", String(state.fps));
      window.open(url.toString(), "_blank", "noopener");
    });

    document.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { togglePlay(); e.preventDefault(); return; }
      if (e.code === "ArrowLeft") { seek(state.currentTime - (e.shiftKey ? 5 : 0.5)); return; }
      if (e.code === "ArrowRight") { seek(state.currentTime + (e.shiftKey ? 5 : 0.5)); return; }
      if (e.code === "KeyC") { setCleanMode(!document.body.classList.contains("clean-mode")); return; }
      const m = e.code.match(/^Digit([1-9])$/);
      if (m) {
        const idx = Number(m[1]) - 1;
        const scene = state.story.scenes[idx];
        if (scene) { seek(scene.start); pause(); }
      }
    });
  }

  function setupTimelineInput() {
    if (!dom.timelineInput) return;
    dom.timelineInput.min = "0";
    dom.timelineInput.max = String(state.duration);
    dom.timelineInput.step = (1 / state.fps).toFixed(6);
  }

  function setupControlPanel() {
    if (dom.controlTitle) dom.controlTitle.textContent = state.story.meta.title;
    if (dom.controlSubtitle) dom.controlSubtitle.textContent = state.story.meta.subtitleNotice || "";
    if (dom.totalFrameCount) dom.totalFrameCount.textContent = String(Math.round(state.duration * state.fps));
    if (dom.renderSpec) dom.renderSpec.textContent = state.story.meta.outputSpec;
  }

  function applyUrlParams() {
    const params = new URLSearchParams(location.search);
    if (params.get("clean") === "1") setCleanMode(true);
    const sceneId = params.get("scene");
    const frame = params.get("frame");
    const t = params.get("t");
    const fpsParam = Number(params.get("fps")) || state.fps;
    if (sceneId) {
      const scene = state.story.scenes.find((s) => s.id === sceneId);
      if (scene) seek(scene.start);
    } else if (frame != null) {
      seek(Number(frame) / fpsParam);
    } else if (t != null) {
      seek(Number(t));
    }
    if (params.get("autoplay") === "1") play();
  }

  window.KnowledgeShortFilm = {
    play, pause, togglePlay, seek, setCleanMode,
    getState: () => ({
      currentTime: state.currentTime,
      isPlaying: state.isPlaying,
      duration: state.duration,
      fps: state.fps,
      sceneIndex: state.currentSceneIndex,
      sceneId: state.activeScene?.id
    })
  };

  async function init() {
    cacheDom();
    await loadStory();
    renderMasthead();
    buildSceneCards();
    buildSceneList();
    setupTimelineInput();
    setupControlPanel();
    bindControls();
    applyUrlParams();
    if (state.currentSceneIndex === -1) activateScene(0);
    renderClock();
    requestAnimationFrame(tick);
  }

  init().catch((err) => {
    console.error(err);
    document.body.innerHTML = `<pre style="padding:32px;color:#f1e7d2;background:#1a1814;white-space:pre-wrap">${(err.stack || err.message)}</pre>`;
  });
})();
