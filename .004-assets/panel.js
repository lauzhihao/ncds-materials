/* ===================================================================
   panel.js — control panel: themes, color overrides, city picker,
              connection order, animation + visibility settings.
   Exposes:  window.Panel = { toggleSelect }
   =================================================================== */

(function() {
  const STORAGE_KEY = "worldmap.v1";

  const state = {
    themeId: "google-light",
    theme: { ...window.THEMES["google-light"] },
    selected: [],
    showLabels: true,
    showLabelEn: false,          // 城市名称：中文常驻，可选叠加英文
    showAllDots: true,
    showGraticule: false,
    showMajor: false,
    animate: true,
    lineSpeed: 1.0,
    greatCircle: false,          // 大圆航线（球面最短路径）连线
    mode: "flat",
    autoRotate: false,
    rotateSpeed: 1.0,
    // highlight animation
    highlightDuration: 1.5,
    highlightLoop: false,
    highlightLoopInterval: 2.5,
    // focus animation
    focusDuration: 1.2,
    autoFocus: false,
    focusZoom: 4.0,
    // panel state
    panelOpen: true,
    activeTab: "theme",
    cityFilter: "",
    regionFilter: "All",
    cityTypeFilter: "all",
    countryFilter: ""
  };

  // ---------- persistence ----------
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        themeId: state.themeId, theme: state.theme, selected: state.selected,
        showLabels: state.showLabels, showLabelEn: state.showLabelEn,
        showAllDots: state.showAllDots,
        showGraticule: state.showGraticule, showMajor: state.showMajor,
        animate: state.animate, lineSpeed: state.lineSpeed,
        greatCircle: state.greatCircle,
        mode: state.mode, autoRotate: state.autoRotate, rotateSpeed: state.rotateSpeed,
        highlightDuration: state.highlightDuration,
        highlightLoop: state.highlightLoop,
        highlightLoopInterval: state.highlightLoopInterval,
        focusDuration: state.focusDuration,
        autoFocus: state.autoFocus,
        focusZoom: state.focusZoom,
        panelOpen: state.panelOpen, activeTab: state.activeTab
      }));
    } catch(e) {}
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (s) {
        Object.assign(state, s);
        const preset = window.THEMES[state.themeId || "google-light"];
        if (!state.theme || typeof state.theme !== "object") {
          state.theme = { ...preset };
        } else {
          // backfill any missing keys from the preset (e.g. highlightFill added later)
          state.theme = { ...preset, ...state.theme };
        }
        return;
      }
    } catch(e) {}
    // first-run defaults: a nice demo route
    state.selected = ["Beijing","Tokyo","Singapore","New Delhi","Moscow","Berlin","London","Washington D.C.","Mexico City","Brasília"];
  }

  function applyTheme() {
    window.WorldMap.setTheme(state.theme);
  }
  function applyVisibility() {
    window.WorldMap.setShowLabels(state.showLabels);
    window.WorldMap.setShowLabelEn(state.showLabelEn);
    window.WorldMap.setShowAllDots(state.showAllDots);
    window.WorldMap.setShowGraticule(state.showGraticule);
    window.WorldMap.setShowMajor(state.showMajor);
    window.WorldMap.setAnimate(state.animate);
    window.WorldMap.setLineSpeed(state.lineSpeed);
    window.WorldMap.setGreatCircle(state.greatCircle);
    window.WorldMap.setAutoRotate(state.autoRotate);
    window.WorldMap.setRotateSpeed(state.rotateSpeed);
    window.WorldMap.setMode(state.mode);
    window.WorldMap.setHighlightDuration(state.highlightDuration);
    window.WorldMap.setHighlightLoopInterval(state.highlightLoopInterval);
    window.WorldMap.setHighlightLoop(state.highlightLoop);
    window.WorldMap.setFocusDuration(state.focusDuration);
    window.WorldMap.setAutoFocus(state.autoFocus);
    window.WorldMap.setFocusZoom(state.focusZoom);
  }
  function applySelection() {
    window.WorldMap.setSelected(state.selected);
    renderCityList();
    renderOrderList();
  }

  // ---------- public API ----------
  function toggleSelect(name) {
    const i = state.selected.indexOf(name);
    const adding = i < 0;
    if (adding) state.selected.push(name);
    else state.selected.splice(i, 1);
    applySelection();
    if (adding && state.autoFocus) {
      const c = (window.ALL_CITIES || window.CAPITALS).find(x => x.name === name);
      if (c) window.WorldMap.focusOn(c.lng, c.lat);
    }
    save();
  }

  window.Panel = { toggleSelect };

  // ---------- BUILD UI ----------
  const panel = document.getElementById("panel");

  // header
  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">控制台 · Map Studio</div>
      <button class="panel-close" id="panel-close" title="收起">✕</button>
    </div>
    <div class="panel-mode">
      <div class="mode-segment">
        <button class="mode-btn" data-mode="flat">🗺  平面</button>
        <button class="mode-btn" data-mode="globe">🌐  地球仪</button>
      </div>
    </div>
    <div class="panel-tabs">
      <button class="panel-tab" data-tab="theme">配色</button>
      <button class="panel-tab" data-tab="cities">城市</button>
      <button class="panel-tab" data-tab="order">连线</button>
      <button class="panel-tab" data-tab="view">显示</button>
    </div>
    <div class="panel-body" id="panel-body"></div>
  `;

  document.getElementById("panel-close").addEventListener("click", () => {
    state.panelOpen = false;
    panel.classList.add("collapsed");
    document.getElementById("panel-toggle").classList.add("visible");
    save();
  });
  document.getElementById("panel-toggle").addEventListener("click", () => {
    state.panelOpen = true;
    panel.classList.remove("collapsed");
    document.getElementById("panel-toggle").classList.remove("visible");
    save();
  });
  panel.querySelectorAll(".panel-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      renderTabs();
      renderBody();
      save();
    });
  });
  panel.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      window.WorldMap.setMode(state.mode);
      panel.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === state.mode));
      // re-render the active tab in case it has mode-dependent rows (view tab)
      if (state.activeTab === "view") renderBody();
      save();
    });
  });
  function syncModeButtons() {
    panel.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === state.mode));
  }

  function renderTabs() {
    panel.querySelectorAll(".panel-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === state.activeTab);
    });
    syncModeButtons();
  }

  // ----------- BODY -----------
  function renderBody() {
    const body = document.getElementById("panel-body");
    body.innerHTML = "";
    switch (state.activeTab) {
      case "theme":  renderThemeTab(body); break;
      case "cities": renderCitiesTab(body); break;
      case "order":  renderOrderTab(body); break;
      case "view":   renderViewTab(body); break;
    }
  }

  // ----------- THEME TAB -----------
  function renderThemeTab(body) {
    // presets
    const presets = document.createElement("div");
    presets.className = "section";
    presets.innerHTML = `<div class="section-title">主题预设</div>`;
    const grid = document.createElement("div");
    grid.className = "preset-grid";
    presets.appendChild(grid);

    window.THEME_ORDER.forEach(id => {
      const t = window.THEMES[id];
      const el = document.createElement("div");
      el.className = "preset" + (id === state.themeId ? " active" : "");
      el.title = t.name;
      el.innerHTML = `
        <div class="preset-sw">
          <div class="preset-water" style="background:${t.water}"></div>
          <div class="preset-land" style="background:${t.land}"></div>
        </div>
        <div class="preset-line" style="background:${t.line};box-shadow:0 0 6px ${t.lineGlow}"></div>
        <div class="preset-dot" style="background:${t.cityFill};border-color:${t.cityRing}"></div>
        <div class="preset-label">${t.name}</div>
      `;
      el.addEventListener("click", () => {
        state.themeId = id;
        state.theme = { ...window.THEMES[id] };
        applyTheme();
        save();
        renderBody();
      });
      grid.appendChild(el);
    });
    body.appendChild(presets);

    // color overrides
    const colors = document.createElement("div");
    colors.className = "section";
    colors.innerHTML = `<div class="section-title">自定义配色</div>`;
    const palette = [
      ["bg",               "背景色（地图外）"],
      ["water",            "海洋"],
      ["land",             "陆地填充"],
      ["landStroke",       "陆地描边"],
      ["border",           "国家边界"],
      ["graticule",        "经纬网格"],
      ["cityFill",         "城市点 · 填充"],
      ["cityRing",         "城市点 · 描边"],
      ["cityHalo",         "城市点 · 光晕"],
      ["label",            "城市文字"],
      ["labelHalo",        "文字描边"],
      ["line",             "连接线"],
      ["lineGlow",         "连接线光晕"],
      ["highlightFill",    "国家高亮 · 填充"],
      ["highlightStroke",  "国家高亮 · 描边"]
    ];
    palette.forEach(([key, label]) => {
      const row = document.createElement("div");
      row.className = "color-row";
      row.innerHTML = `
        <label>${label}</label>
        <span class="color-hex">${state.theme[key].toUpperCase()}</span>
        <span class="color-swatch-wrap" style="background:${state.theme[key]}">
          <input type="color" value="${toHex(state.theme[key])}" data-key="${key}"/>
        </span>
      `;
      row.querySelector("input").addEventListener("input", (ev) => {
        const v = ev.target.value;
        state.theme[key] = v;
        ev.target.parentElement.style.background = v;
        row.querySelector(".color-hex").textContent = v.toUpperCase();
        applyTheme();
        save();
      });
      colors.appendChild(row);
    });
    body.appendChild(colors);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    btnRow.innerHTML = `
      <button class="btn" id="reset-theme">恢复预设</button>
      <button class="btn" id="copy-theme">复制配色</button>
    `;
    btnRow.querySelector("#reset-theme").addEventListener("click", () => {
      state.theme = { ...window.THEMES[state.themeId] };
      applyTheme(); save(); renderBody();
    });
    btnRow.querySelector("#copy-theme").addEventListener("click", () => {
      navigator.clipboard?.writeText(JSON.stringify(state.theme, null, 2));
      flashBtn(btnRow.querySelector("#copy-theme"), "已复制");
    });
    body.appendChild(btnRow);
  }

  // ----------- CITIES TAB -----------
  function renderCitiesTab(body) {
    const wrap = document.createElement("div");
    wrap.className = "section";
    wrap.innerHTML = `
      <div class="section-title">选择首都 · ${state.selected.length} / ${window.CAPITALS.length}</div>
      <input class="search" id="city-search" placeholder="搜索城市（中文 / 英文）或国家…" value="${escapeAttr(state.cityFilter)}"/>
      <div class="filter-row" id="region-filters"></div>
      <div class="filter-row" id="type-filters"></div>
      <div class="city-list" id="city-list"></div>
      <div class="summary">
        <span id="selected-count">已选 ${state.selected.length}</span>
        <span style="cursor:pointer;color:rgba(255,255,255,0.7)" id="clear-all">全部清除</span>
      </div>
      <div class="btn-row">
        <button class="btn primary" id="fit-view">缩放至所选</button>
        <button class="btn" id="reset-view">重置视角</button>
      </div>
    `;
    body.appendChild(wrap);

    const regions = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];
    const rf = wrap.querySelector("#region-filters");
    regions.forEach(r => {
      const c = document.createElement("span");
      c.className = "chip" + (state.regionFilter === r ? " active" : "");
      c.textContent = r === "All" ? "全部" : ({Asia:"亚洲",Europe:"欧洲",Africa:"非洲",Americas:"美洲",Oceania:"大洋洲"}[r] || r);
      c.addEventListener("click", () => {
        state.regionFilter = r;
        renderCityList();
        rf.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        save();
      });
      rf.appendChild(c);
    });

    const tf = wrap.querySelector("#type-filters");
    [["all","全部"],["capital","首都 ★"],["major","主要城市"]].forEach(([id, label]) => {
      const c = document.createElement("span");
      c.className = "chip" + (state.cityTypeFilter === id ? " active" : "");
      c.textContent = label;
      c.addEventListener("click", () => {
        state.cityTypeFilter = id;
        renderCityList();
        tf.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        save();
      });
      tf.appendChild(c);
    });

    wrap.querySelector("#city-search").addEventListener("input", (e) => {
      state.cityFilter = e.target.value;
      renderCityList();
    });
    wrap.querySelector("#clear-all").addEventListener("click", () => {
      state.selected = [];
      applySelection();
      save();
      renderCityList();
      document.getElementById("selected-count").textContent = "已选 0";
    });
    wrap.querySelector("#fit-view").addEventListener("click", () => window.WorldMap.fitToSelection());
    wrap.querySelector("#reset-view").addEventListener("click", () => window.WorldMap.resetView());

    renderCityList();
  }

  function renderCityList() {
    const listEl = document.getElementById("city-list");
    if (!listEl) return;
    const q = state.cityFilter.trim().toLowerCase();
    const region = state.regionFilter;
    const typeFilter = state.cityTypeFilter;

    let list = (window.ALL_CITIES || window.CAPITALS).slice()
      .sort((a,b) => a.name.localeCompare(b.name));
    if (typeFilter === "capital") list = list.filter(c => c.type !== "major");
    else if (typeFilter === "major") list = list.filter(c => c.type === "major");
    if (region !== "All") list = list.filter(c => c.region === region);
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.zh || "").toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q)
    );

    listEl.innerHTML = "";
    if (list.length === 0) {
      listEl.innerHTML = `<div class="empty-hint">没有匹配的城市</div>`;
      return;
    }
    const selSet = new Set(state.selected);
    list.forEach(c => {
      const isSel = selSet.has(c.name);
      const isMajor = c.type === "major";
      const row = document.createElement("div");
      row.className = "city-item" + (isSel ? " selected" : "");
      row.innerHTML = `
        <div class="city-check">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
        </div>
        <div class="city-name">${escapeHtml(c.name)}<span class="city-name-zh">${escapeHtml(c.zh || "")}</span>${isMajor ? '' : ' <span class="city-tag">★</span>'}</div>
        <div class="city-country">${escapeHtml(c.country)}</div>
      `;
      row.addEventListener("click", () => {
        toggleSelect(c.name);
      });
      listEl.appendChild(row);
    });

    const counter = document.getElementById("selected-count");
    if (counter) counter.textContent = `已选 ${state.selected.length}`;
  }

  // ----------- ORDER TAB -----------
  function renderOrderTab(body) {
    const wrap = document.createElement("div");
    wrap.className = "section";
    wrap.innerHTML = `
      <div class="section-title">连线顺序 · ${state.selected.length} 个节点 / ${Math.max(0, state.selected.length - 1)} 条连线</div>
      <div class="order-list" id="order-list"></div>
      <div class="btn-row">
        <button class="btn" id="reverse">反转顺序</button>
        <button class="btn" id="shuffle">随机</button>
        <button class="btn" id="sort-region">按区域</button>
        <button class="btn danger" id="clear">清空</button>
      </div>
      <div class="row column" style="margin-top:14px">
        <label>连线流动速度</label>
        <div class="slider-row">
          <input type="range" min="0" max="3" step="0.1" value="${state.lineSpeed}" id="speed"/>
          <span class="slider-val" id="speed-val">${state.lineSpeed.toFixed(1)}×</span>
        </div>
      </div>
      <div class="row">
        <label>启用流动动画</label>
        <div class="toggle ${state.animate ? 'on' : ''}" id="animate-toggle"></div>
      </div>
      <div class="row">
        <label>大圆航线（球面最短路径）</label>
        <div class="toggle ${state.greatCircle ? 'on' : ''}" id="gc-toggle"></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.6">
        打开后连线沿球面最短路径走，远距离城市会自然向极地拱起（如大连→鹿特丹拱到约 64°N）。地球仪模式下观感最佳。
      </div>
    `;
    body.appendChild(wrap);

    document.getElementById("speed").addEventListener("input", (e) => {
      state.lineSpeed = +e.target.value;
      document.getElementById("speed-val").textContent = state.lineSpeed.toFixed(1) + "×";
      window.WorldMap.setLineSpeed(state.lineSpeed);
      save();
    });
    document.getElementById("animate-toggle").addEventListener("click", (e) => {
      state.animate = !state.animate;
      e.currentTarget.classList.toggle("on", state.animate);
      window.WorldMap.setAnimate(state.animate);
      save();
    });
    document.getElementById("gc-toggle").addEventListener("click", (e) => {
      state.greatCircle = !state.greatCircle;
      e.currentTarget.classList.toggle("on", state.greatCircle);
      window.WorldMap.setGreatCircle(state.greatCircle);
      save();
    });
    document.getElementById("reverse").addEventListener("click", () => {
      state.selected.reverse();
      applySelection(); save();
    });
    document.getElementById("shuffle").addEventListener("click", () => {
      const a = state.selected.slice();
      for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
      state.selected = a;
      applySelection(); save();
    });
    document.getElementById("sort-region").addEventListener("click", () => {
      const order = ["Africa","Europe","Asia","Oceania","Americas"];
      state.selected.sort((a,b) => {
        const ca = window.CAPITALS.find(c=>c.name===a), cb = window.CAPITALS.find(c=>c.name===b);
        return order.indexOf(ca.region) - order.indexOf(cb.region);
      });
      applySelection(); save();
    });
    document.getElementById("clear").addEventListener("click", () => {
      state.selected = []; applySelection(); save();
    });
    renderOrderList();
  }

  function renderOrderList() {
    const el = document.getElementById("order-list");
    if (!el) return;
    el.innerHTML = "";
    if (state.selected.length === 0) {
      el.innerHTML = `<div class="empty-hint">还没有选择城市。<br>在「城市」标签中点击勾选，或直接点击地图上的圆点。</div>`;
      return;
    }
    const cityIndex = window.ALL_CITIES || window.CAPITALS;
    state.selected.forEach((name, i) => {
      const c = cityIndex.find(x => x.name === name);
      const label = c?.zh || name;
      const row = document.createElement("div");
      row.className = "order-item";
      row.draggable = true;
      row.dataset.idx = i;
      row.innerHTML = `
        <div class="order-num">${i+1}</div>
        <div class="order-name">${escapeHtml(label)}<span style="color:rgba(255,255,255,0.4);font-weight:400"> · ${escapeHtml(c?.country || "")}</span></div>
        <div class="order-handle">≡</div>
        <button class="order-remove" title="移除">×</button>
      `;
      row.querySelector(".order-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected.splice(i, 1);
        applySelection(); save();
      });
      // drag handlers
      row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.setData("text/plain", String(i));
        e.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        row.classList.add("drag-over");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const to = parseInt(row.dataset.idx, 10);
        if (isNaN(from) || isNaN(to) || from === to) return;
        const moved = state.selected.splice(from, 1)[0];
        state.selected.splice(to, 0, moved);
        applySelection(); save();
      });
      el.appendChild(row);
    });
  }

  // ----------- VIEW TAB -----------
  function renderViewTab(body) {
    const wrap = document.createElement("div");
    wrap.className = "section";
    wrap.innerHTML = `
      <div class="section-title">显示选项</div>
      <div class="row">
        <label>显示所有城市圆点</label>
        <div class="toggle ${state.showAllDots ? 'on' : ''}" id="t-dots"></div>
      </div>
      <div class="row">
        <label>显示城市文字</label>
        <div class="toggle ${state.showLabels ? 'on' : ''}" id="t-labels"></div>
      </div>
      <div class="row">
        <label>显示经纬网格</label>
        <div class="toggle ${state.showGraticule ? 'on' : ''}" id="t-grat"></div>
      </div>
      <div class="row">
        <label>显示主要城市（非首都）</label>
        <div class="toggle ${state.showMajor ? 'on' : ''}" id="t-major"></div>
      </div>

      <div class="section-title" style="margin-top:18px">城市名称</div>
      <div class="row">
        <label>显示中文名称</label>
        <div class="toggle on locked" id="t-name-zh" title="中文名称常驻显示，不可关闭"></div>
      </div>
      <div class="row">
        <label>叠加显示英文名称</label>
        <div class="toggle ${state.showLabelEn ? 'on' : ''}" id="t-name-en"></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:4px">
        默认显示中文；打开后在中文下方叠加英文名称。仅作用于已选城市的标签。
      </div>

      ${state.mode === "globe" ? `
      <div class="section-title" style="margin-top:18px">地球仪</div>
      <div class="row">
        <label>自动旋转</label>
        <div class="toggle ${state.autoRotate ? 'on' : ''}" id="t-autorot"></div>
      </div>
      <div class="row column">
        <label>旋转速度</label>
        <div class="slider-row">
          <input type="range" min="-3" max="3" step="0.1" value="${state.rotateSpeed}" id="rot-speed"/>
          <span class="slider-val" id="rot-speed-val">${state.rotateSpeed.toFixed(1)}×</span>
        </div>
      </div>
      ` : ""}

      <div class="section-title" style="margin-top:18px">国家高亮</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:8px">
        点击地图上的任意国家即可高亮其边界，或按国家名称搜索后点选。
      </div>
      <input class="search" id="country-search" placeholder="搜索国家名称，例如：中国 / China" value="${escapeAttr(state.countryFilter)}"/>
      <div class="country-list" id="country-list"></div>
      <div class="row column">
        <label>动画时长 <span style="color:rgba(255,255,255,0.4)">（描边 + 填充）</span></label>
        <div class="slider-row">
          <input type="range" min="0.3" max="5" step="0.1" value="${state.highlightDuration}" id="hl-dur"/>
          <span class="slider-val" id="hl-dur-val">${state.highlightDuration.toFixed(1)}s</span>
        </div>
      </div>
      <div class="row">
        <label>循环播放</label>
        <div class="toggle ${state.highlightLoop ? 'on' : ''}" id="t-hl-loop"></div>
      </div>
      <div class="row column">
        <label>循环间隔</label>
        <div class="slider-row">
          <input type="range" min="0.5" max="8" step="0.1" value="${state.highlightLoopInterval}" id="hl-iv"/>
          <span class="slider-val" id="hl-iv-val">${state.highlightLoopInterval.toFixed(1)}s</span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn primary" id="play-hl">▶ 播放动画</button>
        <button class="btn danger" id="clear-hl">清除高亮</button>
      </div>

      <div class="section-title" style="margin-top:18px">聚焦动画</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:8px">
        选中城市或点击国家时，自动飞到目标位置。平面模式平移+缩放；地球仪模式旋转球面。
      </div>
      <div class="row">
        <label>自动聚焦（选中时）</label>
        <div class="toggle ${state.autoFocus ? 'on' : ''}" id="t-auto-focus"></div>
      </div>
      <div class="row column">
        <label>聚焦动画时长</label>
        <div class="slider-row">
          <input type="range" min="0.3" max="4" step="0.1" value="${state.focusDuration}" id="f-dur"/>
          <span class="slider-val" id="f-dur-val">${state.focusDuration.toFixed(1)}s</span>
        </div>
      </div>
      <div class="row column">
        <label>聚焦缩放等级</label>
        <div class="slider-row">
          <input type="range" min="1.5" max="10" step="0.1" value="${state.focusZoom}" id="f-zoom"/>
          <span class="slider-val" id="f-zoom-val">${state.focusZoom.toFixed(1)}×</span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn primary" id="focus-last">▶ 聚焦到上次选择</button>
        <button class="btn" id="focus-reset">重置视角</button>
      </div>

      <div class="section-title" style="margin-top:18px">视频导出建议</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.6">
        将浏览器调整为 1920×1080 等目标分辨率后，使用屏幕录制软件（OBS / Screen Studio）<br>
        录制此页面。点击右下角 <b>F</b> 进入纯净背景模式。
      </div>

      <div class="btn-row" style="margin-top:12px">
        <button class="btn" id="hide-ui">隐藏控制台</button>
        <button class="btn primary" id="dl-svg">下载 SVG</button>
      </div>

      <div class="section-title" style="margin-top:18px">导出配置</div>
      <div class="btn-row">
        <button class="btn" id="copy-config">复制配置</button>
        <button class="btn" id="paste-config">粘贴配置</button>
      </div>
    `;
    body.appendChild(wrap);

    wrap.querySelector("#country-search").addEventListener("input", (e) => {
      state.countryFilter = e.target.value;
      renderCountryList();
    });
    wrap.querySelector("#t-dots").addEventListener("click", (e) => {
      state.showAllDots = !state.showAllDots;
      e.currentTarget.classList.toggle("on", state.showAllDots);
      window.WorldMap.setShowAllDots(state.showAllDots); save();
    });
    wrap.querySelector("#t-labels").addEventListener("click", (e) => {
      state.showLabels = !state.showLabels;
      e.currentTarget.classList.toggle("on", state.showLabels);
      window.WorldMap.setShowLabels(state.showLabels); save();
    });
    wrap.querySelector("#t-grat").addEventListener("click", (e) => {
      state.showGraticule = !state.showGraticule;
      e.currentTarget.classList.toggle("on", state.showGraticule);
      window.WorldMap.setShowGraticule(state.showGraticule); save();
    });
    wrap.querySelector("#t-major").addEventListener("click", (e) => {
      state.showMajor = !state.showMajor;
      e.currentTarget.classList.toggle("on", state.showMajor);
      window.WorldMap.setShowMajor(state.showMajor); save();
    });
    wrap.querySelector("#t-name-en").addEventListener("click", (e) => {
      state.showLabelEn = !state.showLabelEn;
      e.currentTarget.classList.toggle("on", state.showLabelEn);
      window.WorldMap.setShowLabelEn(state.showLabelEn); save();
    });
    if (state.mode === "globe") {
      wrap.querySelector("#t-autorot").addEventListener("click", (e) => {
        state.autoRotate = !state.autoRotate;
        e.currentTarget.classList.toggle("on", state.autoRotate);
        window.WorldMap.setAutoRotate(state.autoRotate); save();
      });
      wrap.querySelector("#rot-speed").addEventListener("input", (e) => {
        state.rotateSpeed = +e.target.value;
        document.getElementById("rot-speed-val").textContent = state.rotateSpeed.toFixed(1) + "×";
        window.WorldMap.setRotateSpeed(state.rotateSpeed); save();
      });
    }
    wrap.querySelector("#clear-hl").addEventListener("click", () => {
      window.WorldMap.clearHighlights();
      renderCountryList();
    });

    // highlight animation controls
    wrap.querySelector("#hl-dur").addEventListener("input", (e) => {
      state.highlightDuration = +e.target.value;
      document.getElementById("hl-dur-val").textContent = state.highlightDuration.toFixed(1) + "s";
      window.WorldMap.setHighlightDuration(state.highlightDuration); save();
    });
    wrap.querySelector("#t-hl-loop").addEventListener("click", (e) => {
      state.highlightLoop = !state.highlightLoop;
      e.currentTarget.classList.toggle("on", state.highlightLoop);
      window.WorldMap.setHighlightLoop(state.highlightLoop); save();
    });
    wrap.querySelector("#hl-iv").addEventListener("input", (e) => {
      state.highlightLoopInterval = +e.target.value;
      document.getElementById("hl-iv-val").textContent = state.highlightLoopInterval.toFixed(1) + "s";
      window.WorldMap.setHighlightLoopInterval(state.highlightLoopInterval); save();
    });
    wrap.querySelector("#play-hl").addEventListener("click", () => {
      window.WorldMap.replayHighlights();
    });

    // focus animation controls
    wrap.querySelector("#t-auto-focus").addEventListener("click", (e) => {
      state.autoFocus = !state.autoFocus;
      e.currentTarget.classList.toggle("on", state.autoFocus);
      window.WorldMap.setAutoFocus(state.autoFocus); save();
    });
    wrap.querySelector("#f-dur").addEventListener("input", (e) => {
      state.focusDuration = +e.target.value;
      document.getElementById("f-dur-val").textContent = state.focusDuration.toFixed(1) + "s";
      window.WorldMap.setFocusDuration(state.focusDuration); save();
    });
    wrap.querySelector("#f-zoom").addEventListener("input", (e) => {
      state.focusZoom = +e.target.value;
      document.getElementById("f-zoom-val").textContent = state.focusZoom.toFixed(1) + "×";
      window.WorldMap.setFocusZoom(state.focusZoom); save();
    });
    wrap.querySelector("#focus-last").addEventListener("click", () => {
      window.WorldMap.focusOnLast();
    });
    wrap.querySelector("#focus-reset").addEventListener("click", () => {
      window.WorldMap.resetView();
    });

    wrap.querySelector("#hide-ui").addEventListener("click", () => {
      document.body.classList.toggle("clean-mode");
    });
    wrap.querySelector("#dl-svg").addEventListener("click", downloadSVG);

    wrap.querySelector("#copy-config").addEventListener("click", () => {
      const cfg = { themeId: state.themeId, theme: state.theme, selected: state.selected,
        showLabels: state.showLabels, showAllDots: state.showAllDots,
        showGraticule: state.showGraticule, lineSpeed: state.lineSpeed };
      navigator.clipboard?.writeText(JSON.stringify(cfg, null, 2));
      flashBtn(wrap.querySelector("#copy-config"), "已复制");
    });
    wrap.querySelector("#paste-config").addEventListener("click", async () => {
      try {
        const txt = await navigator.clipboard.readText();
        const cfg = JSON.parse(txt);
        if (cfg.theme) state.theme = cfg.theme;
        if (cfg.themeId) state.themeId = cfg.themeId;
        if (Array.isArray(cfg.selected)) state.selected = cfg.selected;
        if (typeof cfg.showLabels === "boolean") state.showLabels = cfg.showLabels;
        if (typeof cfg.showAllDots === "boolean") state.showAllDots = cfg.showAllDots;
        if (typeof cfg.showGraticule === "boolean") state.showGraticule = cfg.showGraticule;
        if (typeof cfg.lineSpeed === "number") state.lineSpeed = cfg.lineSpeed;
        applyTheme(); applyVisibility(); applySelection();
        save(); renderBody();
        flashBtn(wrap.querySelector("#paste-config"), "已应用");
      } catch (e) {
        flashBtn(wrap.querySelector("#paste-config"), "失败");
      }
    });

    renderCountryList();
  }

  function renderCountryList() {
    const listEl = document.getElementById("country-list");
    if (!listEl) return;

    const q = state.countryFilter.trim();
    if (!q) {
      listEl.innerHTML = `<div class="empty-hint">输入国家名称后显示匹配结果。搜索“中国”会联动台湾和南海诸岛。</div>`;
      return;
    }

    const results = window.WorldMap.searchCountries(q, 12);
    listEl.innerHTML = "";
    if (!results.length) {
      listEl.innerHTML = `<div class="empty-hint">没有匹配的国家</div>`;
      return;
    }

    results.forEach(item => {
      const row = document.createElement("div");
      row.className = "country-item" + (item.highlighted ? " selected" : "");
      row.innerHTML = `
        <div class="city-check">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
        </div>
        <div class="country-name">${escapeHtml(item.name)}</div>
        <div class="country-detail">${escapeHtml(item.detail || "")}</div>
      `;
      row.addEventListener("click", () => {
        window.WorldMap.toggleCountryHighlightById(item.id);
        renderCountryList();
      });
      listEl.appendChild(row);
    });
  }

  // ---------- helpers ----------
  function toHex(v) {
    // accept #rrggbb or short forms
    if (!v) return "#000000";
    if (v.startsWith("#") && v.length === 7) return v;
    if (v.startsWith("#") && v.length === 4) {
      return "#" + v.slice(1).split("").map(c => c+c).join("");
    }
    return v;
  }
  function escapeAttr(s) { return String(s || "").replace(/"/g, "&quot;"); }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }
  function flashBtn(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 1000);
  }
  function downloadSVG() {
    const svg = document.querySelector("#stage svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    // inline computed styles for export
    const cs = getComputedStyle(document.documentElement);
    const tokens = ["--c-water","--c-land","--c-land-stroke","--c-border","--c-graticule",
      "--c-city-fill","--c-city-ring","--c-city-halo","--c-label","--c-label-halo",
      "--c-line","--c-line-glow","--c-pulse","--c-highlight-fill","--c-highlight-stroke"];
    let styleTxt = `:root{${tokens.map(t => `${t}:${cs.getPropertyValue(t)};`).join("")}}`;
    const styleEl = document.createElement("style");
    styleEl.textContent = styleTxt + "\n" + Array.from(document.styleSheets).map(s => {
      try { return Array.from(s.cssRules).map(r => r.cssText).join("\n"); }
      catch(e) { return ""; }
    }).join("\n");
    clone.insertBefore(styleEl, clone.firstChild);
    const blob = new Blob([clone.outerHTML], {type: "image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "world-map.svg";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- BOOT ----------
  load();
  renderTabs();
  renderBody();
  applyTheme();
  applyVisibility();

  if (!state.panelOpen) {
    panel.classList.add("collapsed");
    document.getElementById("panel-toggle").classList.add("visible");
  }

  // wait for map then push selection
  const waitMap = setInterval(() => {
    if (window.WorldMap && window.WorldMap.getState) {
      clearInterval(waitMap);
      applySelection();
    }
  }, 50);

  // keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "f" || e.key === "F") document.body.classList.toggle("clean-mode");
    if (e.key === "h" || e.key === "H") {
      state.panelOpen = !state.panelOpen;
      panel.classList.toggle("collapsed", !state.panelOpen);
      document.getElementById("panel-toggle").classList.toggle("visible", !state.panelOpen);
      save();
    }
    if (e.key === "+" || e.key === "=") window.WorldMap.zoomIn();
    if (e.key === "-" || e.key === "_") window.WorldMap.zoomOut();
    if (e.key === "0") window.WorldMap.resetView();
  });
})();
