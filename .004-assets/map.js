/* ===================================================================
   map.js — world-map rendering, projection, pan/zoom, capitals, lines
   Supports:  flat (Mercator)  +  globe (Orthographic, draggable + auto-rotate)
   =================================================================== */

(function() {
  const WORLD_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
  // 真实航线网络（OpenFlights，ODbL），离线烘焙好的出向邻接表。懒加载：
  // 只有真实航线开关打开时才 fetch，平时完全不影响现有功能与加载。
  const AIR_NET_URL = ".004-assets/air-network.json";
  // 真实航海网络（searoute 离线算好的主干航道折线）。同样懒/预加载，不影响现有功能。
  const SEA_NET_URL = ".004-assets/sea-network.json";
  const CHINA_TERRITORY_IDS = new Set(["156", "158"]);
  const SOUTH_CHINA_SEA_ISLANDS = [
    { id: "dongsha", name: "东沙群岛", lng: 116.7, lat: 20.7 },
    { id: "xisha", name: "西沙群岛", lng: 112.3, lat: 16.5 },
    { id: "zhongsha", name: "中沙群岛", lng: 114.4, lat: 15.7 },
    { id: "nansha", name: "南沙群岛", lng: 114.2, lat: 10.0 }
  ];
  const CHINA_SEARCH_ALIASES = [
    "china", "prc", "people's republic of china", "people republic of china",
    "zhongguo", "中国", "中國", "中华人民共和国", "中華人民共和國",
    "taiwan", "taiwan china", "中国台湾", "中國台灣", "台湾", "台灣",
    "south china sea", "南海", "南海诸岛", "南海諸島"
  ];

  let svg, gRoot, gSphere, gGrat, gLand, gHighlight, gSouthSea, gBorder, gSea, gAir, gConn, gConnFlow, gCity, gLabel, gBadge, gHandle;
  let projectionFlat, projectionGlobe, projection, pathGen;
  let width = 0, height = 0;
  let zoomBehavior, rotateDrag;
  let currentTransform = { k: 1, x: 0, y: 0 };
  let countriesFeatures = null, bordersMesh = null;

  // state
  const state = {
    mode: "flat",                    // "flat" | "globe"
    rotation: [0, -20, 0],
    autoRotate: false,
    rotateSpeed: 1.0,

    selected: [],
    highlighted: new Set(),          // set of country numeric ids (topojson id)
    lastTarget: null,                // { type, lng, lat } — for "focus on last selection"

    showLabels: true,
    showLabelEn: false,              // overlay English under the Chinese label
    showAllDots: true,
    showGraticule: false,
    showMajor: false,                // show non-capital cities

    lineSpeed: 1.0,
    animate: true,
    showRoute: true,                // master: draw connection lines at all
    greatCircle: false,             // 连线走球面最短路径（大圆航线），far pairs bow polar

    // real airline routes (OpenFlights) — independent additive layer, off by default.
    // 选中城市 → 匹配最近机场 → 扇出该机场最繁忙的前 N 条真实航线（恒定大圆）。
    showAirRoutes: false,
    airMaxPerCity: 40,

    // real shipping lanes (searoute) — global backbone network, off by default.
    // 与选中城市无关：打开即画一组真实主干集装箱航道（绕陆地、过运河海峡）。
    showSeaRoutes: false,

    // manual bend: per-segment hand-tuned curve. keyed by "A→B".
    // value = { along: 0..1 (apex position), perp: signed ratio of segment len }
    bends: {},
    bendEdit: false,                // show draggable handles to bend connections

    // highlight animation
    highlightDuration: 1.5,          // total seconds (trace + fill)
    highlightLoop: false,
    highlightLoopInterval: 2.5,      // seconds between loop iterations

    // focus animation
    focusDuration: 1.2,              // seconds
    autoFocus: false,                // auto-focus on new selection
    focusZoom: 4.0                   // target zoom factor (flat) / globe scale multiplier
  };

  const cityByName = {};
  function rebuildCityLookup() {
    Object.keys(cityByName).forEach(k => delete cityByName[k]);
    (window.ALL_CITIES || window.CAPITALS).forEach(c => { cityByName[c.name] = c; });
  }

  // ---------- INIT ----------
  async function init() {
    rebuildCityLookup();
    const stage = document.getElementById("stage");
    width = stage.clientWidth;
    height = stage.clientHeight;

    svg = d3.select(stage).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid slice");

    // projections
    projectionFlat = d3.geoMercator()
      .scale((width / (2 * Math.PI)) * 0.95)
      .translate([width / 2, height / 2 + 30])
      .center([0, 20]);

    projectionGlobe = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.4)
      .translate([width / 2, height / 2])
      .rotate(state.rotation)
      .clipAngle(90)
      .precision(0.6);

    projection = projectionFlat;
    pathGen = d3.geoPath(projection);

    gRoot     = svg.append("g").attr("class", "g-root");
    gSphere   = gRoot.append("g").attr("class", "sphere-layer");
    gGrat     = gRoot.append("g").attr("class", "graticule-layer");
    gLand     = gRoot.append("g").attr("class", "land-layer");
    gHighlight= gRoot.append("g").attr("class", "highlight-layer");
    gSouthSea = gRoot.append("g").attr("class", "south-sea-layer");
    gBorder   = gRoot.append("g").attr("class", "border-layer");
    gSea      = gRoot.append("g").attr("class", "sea-layer");
    gAir      = gRoot.append("g").attr("class", "air-layer");
    gConn     = gRoot.append("g").attr("class", "conn-layer");
    gConnFlow = gRoot.append("g").attr("class", "conn-flow-layer");
    gCity     = gRoot.append("g").attr("class", "city-layer");
    gLabel    = gRoot.append("g").attr("class", "label-layer");
    gBadge    = gRoot.append("g").attr("class", "badge-layer");
    gHandle   = gRoot.append("g").attr("class", "handle-layer");

    // sphere
    gSphere.append("path")
      .datum({ type: "Sphere" })
      .attr("class", "sphere")
      .attr("d", pathGen);

    // graticule
    gGrat.append("path")
      .datum(d3.geoGraticule().step([20, 20])())
      .attr("class", "graticule")
      .attr("d", pathGen);
    gGrat.style("display", state.showGraticule ? null : "none");

    // load world
    try {
      const res = await fetch(WORLD_URL);
      const worldData = await res.json();
      countriesFeatures = topojson.feature(worldData, worldData.objects.countries).features;
      bordersMesh = topojson.mesh(worldData, worldData.objects.countries, (a,b) => a !== b);

      gLand.selectAll("path.land")
        .data(countriesFeatures, d => d.id)
        .enter().append("path")
        .attr("class", "land")
        .attr("d", pathGen)
        .on("click", function(ev, d) {
          ev.stopPropagation();
          const ids = getCountryHighlightIds(d.id);
          const active = ids.length > 0 && ids.every(id => state.highlighted.has(id));
          const center = d3.geoCentroid(d);
          state.lastTarget = { lng: center[0], lat: center[1] };
          if (active) {
            ids.forEach(id => state.highlighted.delete(id));
            updateCountryHighlight();
            return;
          }
          // adding highlight
          if (state.autoFocus) {
            focusOn(center[0], center[1]);
            // start trace ~halfway through the focus so it plays as we arrive
            setTimeout(() => {
              ids.forEach(id => state.highlighted.add(id));
              updateCountryHighlight();
            }, Math.max(0, state.focusDuration * 1000 * 0.55));
          } else {
            ids.forEach(id => state.highlighted.add(id));
            updateCountryHighlight();
          }
        });

      gBorder.append("path")
        .datum(bordersMesh)
        .attr("class", "border")
        .attr("d", pathGen);
    } catch (err) {
      console.error("Failed to load world atlas:", err);
    }

    // interactions: build both, attach the right one for current mode
    zoomBehavior = d3.zoom()
      .scaleExtent([1, 14])
      .translateExtent([[-width * 0.3, -height * 0.3], [width * 1.3, height * 1.3]])
      .on("start", () => document.getElementById("stage").classList.add("dragging"))
      .on("end",   () => document.getElementById("stage").classList.remove("dragging"))
      .on("zoom", ev => {
        currentTransform = ev.transform;
        gRoot.attr("transform", ev.transform);
        updateScaleCompensation();
      });

    rotateDrag = d3.drag()
      .on("start", function(ev) {
        this.__r0 = state.rotation.slice();
        this.__p0 = [ev.x, ev.y];
        document.getElementById("stage").classList.add("dragging");
      })
      .on("drag", function(ev) {
        const r0 = this.__r0, p0 = this.__p0;
        const sens = 0.4;
        state.rotation = [
          r0[0] + (ev.x - p0[0]) * sens,
          Math.max(-89, Math.min(89, r0[1] - (ev.y - p0[1]) * sens)),
          r0[2]
        ];
        projectionGlobe.rotate(state.rotation);
        redrawWorld(); renderCities(); renderConnections();
      })
      .on("end", () => document.getElementById("stage").classList.remove("dragging"));

    // initial cities & mode
    renderCities();
    setMode(state.mode, true);

    // resize
    window.addEventListener("resize", onResize);

    // animation loops
    startFlowAnimation();
    startAutoRotateLoop();

    // eager-load the full real-route datasets in the background so航空/航海图
    // 一打开就能立刻渲染（非阻塞，失败也不影响地图本身）。
    loadAirNet();
    loadSeaNet();

    return true;
  }

  function onResize() {
    const stage = document.getElementById("stage");
    width = stage.clientWidth;
    height = stage.clientHeight;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    projectionFlat
      .scale((width / (2 * Math.PI)) * 0.95)
      .translate([width / 2, height / 2 + 30]);
    projectionGlobe
      .scale(Math.min(width, height) / 2.4)
      .translate([width / 2, height / 2]);
    pathGen = d3.geoPath(projection);
    redrawWorld();
    renderCities();
    renderConnections();
    zoomBehavior.translateExtent([[-width * 0.3, -height * 0.3], [width * 1.3, height * 1.3]]);
  }

  // ---------- MODE SWITCH ----------
  function setMode(mode, force) {
    if (!force && mode === state.mode) return;
    state.mode = mode;
    if (mode === "flat") {
      projection = projectionFlat;
      svg.on(".drag", null);
      svg.on("wheel.globe", null);
      svg.call(zoomBehavior);
      svg.call(zoomBehavior.transform, d3.zoomIdentity);
      currentTransform = { k: 1, x: 0, y: 0 };
      gRoot.attr("transform", null);
    } else {
      projection = projectionGlobe.rotate(state.rotation);
      // detach zoom listener
      svg.on(".zoom", null);
      // reset gRoot transform
      gRoot.attr("transform", null);
      currentTransform = { k: 1, x: 0, y: 0 };
      // attach rotate-drag
      svg.call(rotateDrag);
      // wheel: change projection scale (i.e. zoom on the globe)
      svg.on("wheel.globe", (ev) => {
        ev.preventDefault();
        const s = projection.scale();
        const next = s * (ev.deltaY > 0 ? 0.9 : 1.1);
        const minS = Math.min(width, height) / 4;
        const maxS = Math.min(width, height) * 4;
        projection.scale(Math.max(minS, Math.min(maxS, next)));
        redrawWorld(); renderCities(); renderConnections();
      });
    }
    pathGen = d3.geoPath(projection);
    redrawWorld();
    renderCities();
    renderConnections();
    updateScaleCompensation();
  }

  function redrawWorld() {
    gSphere.select("path.sphere").attr("d", pathGen);
    gGrat.select("path.graticule").attr("d", pathGen);
    if (countriesFeatures) {
      gLand.selectAll("path.land").attr("d", pathGen);
      gBorder.select("path.border").attr("d", pathGen);
    }
    syncHighlightPaths();
  }

  // ---------- CITIES + LABELS ----------
  function visibleCities() {
    const all = window.ALL_CITIES || window.CAPITALS;
    // filter major cities if disabled (and not selected)
    const selSet = new Set(state.selected);
    return all.filter(c => {
      if (c.type === "major" && !state.showMajor && !selSet.has(c.name)) return false;
      return true;
    });
  }

  function isPointVisible(lng, lat) {
    if (state.mode === "flat") return true;
    const r = projection.rotate();
    const center = [-r[0], -r[1]];
    return d3.geoDistance([lng, lat], center) < (Math.PI / 2 - 0.02);
  }

  function projectSafe(c) {
    const p = projection([c.lng, c.lat]);
    if (!p || isNaN(p[0]) || isNaN(p[1])) return null;
    return p;
  }

  function renderCities() {
    const data = visibleCities();
    const selSet = new Set(state.selected);

    // dots
    const dotSel = gCity.selectAll("circle.city-dot").data(data, d => d.name);
    dotSel.exit().remove();
    const dotEnter = dotSel.enter().append("circle")
      .attr("class", "city-dot")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        window.Panel && window.Panel.toggleSelect(d.name);
      });
    dotEnter.merge(dotSel)
      .attr("cx", d => { const p = projectSafe(d); return p ? p[0] : -9999; })
      .attr("cy", d => { const p = projectSafe(d); return p ? p[1] : -9999; })
      .style("display", d => isPointVisible(d.lng, d.lat) ? null : "none")
      .classed("major", d => d.type === "major");

    // labels
    const labSel = gLabel.selectAll("text.city-label").data(data, d => d.name);
    labSel.exit().remove();
    const labEnter = labSel.enter().append("text")
      .attr("class", "city-label")
      .attr("text-anchor", "middle");
    const labMerged = labEnter.merge(labSel)
      .attr("x", d => { const p = projectSafe(d); return p ? p[0] : -9999; })
      .attr("y", d => { const p = projectSafe(d); return p ? p[1] : -9999; })
      .style("display", d => isPointVisible(d.lng, d.lat) ? null : "none");
    renderLabelText(labMerged);

    updateSelectionVisuals();
    updateScaleCompensation();
  }

  // Build the label content: Chinese is always the primary line; when
  // showLabelEn is on (and the names differ) the English name is stacked
  // underneath it. Both lines sit above the city dot.
  // tspan dy uses `em`, so the offsets scale automatically with font-size.
  function renderLabelText(sel) {
    sel.each(function(d) {
      const t = d3.select(this);
      const p = projectSafe(d);
      const px = p ? p[0] : -9999;
      const zh = d.zh || d.name;
      const en = d.name;
      t.selectAll("tspan").remove();
      if (state.showLabelEn && en && en !== zh) {
        t.append("tspan").attr("class", "lbl-zh").attr("x", px).attr("dy", "-1.75em").text(zh);
        t.append("tspan").attr("class", "lbl-en").attr("x", px).attr("dy", "1.18em").text(en);
      } else {
        t.append("tspan").attr("class", "lbl-zh").attr("x", px).attr("dy", "-0.55em").text(zh);
      }
    });
  }

  function updateSelectionVisuals() {
    const selSet = new Set(state.selected);
    const showAll = state.showAllDots;
    gCity.selectAll("circle.city-dot")
      .classed("selected", d => selSet.has(d.name))
      .classed("dim", d => !selSet.has(d.name))
      .style("display", function(d) {
        if (!isPointVisible(d.lng, d.lat)) return "none";
        if (selSet.has(d.name)) return null;
        return showAll ? null : "none";
      });
    gLabel.selectAll("text.city-label")
      .classed("dim", d => !selSet.has(d.name))
      .style("display", function(d) {
        if (!state.showLabels) return "none";
        if (!isPointVisible(d.lng, d.lat)) return "none";
        // Only show labels for SELECTED cities. If nothing selected, no labels.
        return selSet.has(d.name) ? null : "none";
      });
  }

  // Make labels + markers TRULY constant in screen pixels.
  // In flat mode, gRoot is scaled by k, so we set inner sizes to base/k.
  // In globe mode, gRoot has no scale; just use base sizes.
  function updateScaleCompensation() {
    const k = state.mode === "flat" ? (currentTransform.k || 1) : 1;
    const dotR        = 2.8 / k;
    const dotRSel     = 4.2 / k;
    const haloR       = 11  / k;
    const dotStroke   = 1.6 / k;
    const labelSize   = 12  / k;
    const labelStroke = 3.2 / k;
    const lineW       = 1.7 / k;
    const flowW       = 2.4 / k;
    const flowDash    = `${14/k} ${18/k}`;
    const airLineW    = 0.9 / k;
    const airDotR     = 1.9 / k;
    const seaLineW    = 1.3 / k;
    const seaFlowW    = 1.8 / k;
    const seaFlowDash = `${10/k} ${16/k}`;
    const seaDotR     = 2.2 / k;
    const badgeR      = 9   / k;
    const badgeFs     = 10  / k;
    const badgeStroke = 1.5 / k;
    const landStroke  = 0.6 / k;
    const borderStroke= 0.6 / k;
    const gratStroke  = 0.5 / k;
    const hlStroke    = 2.4 / k;
    const islandHaloR = 12  / k;
    const islandDotR  = 4   / k;
    const islandStroke= 1.4 / k;
    const islandLabel = 11  / k;

    gCity.selectAll("circle.city-dot")
      .attr("r", function() {
        return d3.select(this).classed("selected") ? dotRSel
             : d3.select(this).classed("major") ? dotR * 0.78
             : dotR;
      })
      .attr("stroke-width", dotStroke);
    gCity.selectAll("circle.city-halo").attr("r", haloR);
    gLabel.selectAll("text.city-label")
      .style("font-size", labelSize + "px")
      .style("stroke-width", labelStroke + "px");
    gConn.selectAll(".connection").style("stroke-width", lineW + "px");
    gConnFlow.selectAll(".connection-flow")
      .style("stroke-width", flowW + "px")
      .style("stroke-dasharray", flowDash);
    gAir.selectAll("path.air-route").style("stroke-width", airLineW + "px");
    gAir.selectAll("circle.air-dot")
      .attr("r", airDotR)
      .attr("stroke-width", (0.8 / k) + "px");
    gSea.selectAll("path.sea-route").style("stroke-width", seaLineW + "px");
    gSea.selectAll("path.sea-flow")
      .style("stroke-width", seaFlowW + "px")
      .style("stroke-dasharray", seaFlowDash);
    gSea.selectAll("circle.sea-dot")
      .attr("r", seaDotR)
      .attr("stroke-width", (1 / k) + "px");

    gBadge.selectAll("circle.order-badge")
      .attr("r", badgeR)
      .attr("stroke-width", badgeStroke);
    gBadge.selectAll("text.order-badge-text").style("font-size", badgeFs + "px");

    gHandle.selectAll("circle.bend-handle")
      .attr("r", 6.5 / k)
      .attr("stroke-width", 2 / k);

    gLand.selectAll("path.land")
      .style("stroke-width", landStroke + "px");
    gHighlight.selectAll("path.country-highlight")
      .style("stroke-width", hlStroke + "px");
    gSouthSea.selectAll("circle.south-sea-halo").attr("r", islandHaloR);
    gSouthSea.selectAll("circle.south-sea-dot")
      .attr("r", islandDotR)
      .attr("stroke-width", islandStroke);
    gSouthSea.selectAll("text.south-sea-label")
      .style("font-size", islandLabel + "px")
      .style("stroke-width", (3 / k) + "px");
    gBorder.select("path.border").style("stroke-width", borderStroke + "px");
    gGrat.select("path.graticule").style("stroke-width", gratStroke + "px");
  }

  // ---------- CONNECTIONS ----------
  function renderConnections() {
    // real airline routes + shipping lanes render independently of the manual-route switch
    renderAirRoutes();
    renderSeaRoutes();
    // master switch off → no lines / flow / badges / handles, cities only
    if (!state.showRoute) {
      gConn.selectAll("*").remove();
      gConnFlow.selectAll("*").remove();
      gBadge.selectAll("*").remove();
      gHandle.selectAll("*").remove();
      updateScaleCompensation();
      return;
    }
    const sel = state.selected;
    const segs = [];
    for (let i = 0; i < sel.length - 1; i++) {
      const a = cityByName[sel[i]];
      const b = cityByName[sel[i+1]];
      if (a && b) segs.push({ a, b, idx: i });
    }
    const paths = segs.map(s => segmentPath(s.a, s.b));

    const base = gConn.selectAll("path.connection").data(paths);
    base.exit().remove();
    base.enter().append("path").attr("class","connection")
      .merge(base).attr("d", d => d);

    const flow = gConnFlow.selectAll("path.connection-flow").data(paths);
    flow.exit().remove();
    flow.enter().append("path").attr("class","connection-flow")
      .merge(flow).attr("d", d => d);

    // order badges only for selected cities currently visible
    const badgeData = sel.map((name, idx) => {
      const c = cityByName[name];
      if (!c) return null;
      if (!isPointVisible(c.lng, c.lat)) return null;
      const p = projectSafe(c);
      if (!p) return null;
      return { name, idx: idx + 1, x: p[0], y: p[1] };
    }).filter(Boolean);

    const bg = gBadge.selectAll("g.badge-group").data(badgeData, d => d.name);
    bg.exit().remove();
    const bgEnter = bg.enter().append("g").attr("class","badge-group");
    bgEnter.append("circle").attr("class","order-badge").attr("r", 9);
    bgEnter.append("text").attr("class","order-badge-text");
    const merged = bgEnter.merge(bg);
    const offset = 14 / (state.mode === "flat" ? (currentTransform.k || 1) : 1);
    merged.attr("transform", d => `translate(${d.x + offset},${d.y - offset})`);
    merged.select("text.order-badge-text").text(d => d.idx);

    renderBendHandles(segs);
    updateScaleCompensation();
  }

  // ---------- MANUAL BEND ----------
  // Each connection can be hand-bent: grab the mid handle and pull it sideways.
  // The bend is stored as { along, perp } ratios relative to the segment, so it
  // stays put across zoom / globe rotation (we rebuild from the live endpoints).
  function segKey(a, b) { return a.name + "→" + b.name; }

  // segment geometry in gRoot-local coords (same space as projectSafe / handles)
  function segGeom(a, b) {
    const A = projectSafe(a), B = projectSafe(b);
    if (!A || !B) return null;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) return null;
    const ux = dx / len, uy = dy / len;   // along unit
    const px = -uy, py = ux;              // left-perpendicular unit
    return { A, B, len, ux, uy, px, py };
  }

  // apex point the handle sits on, for a given bend
  function bendApex(g, bend) {
    const along = bend ? bend.along : 0.5;
    const perp  = bend ? bend.perp  : 0;
    return [
      g.A[0] + g.ux * (along * g.len) + g.px * (perp * g.len),
      g.A[1] + g.uy * (along * g.len) + g.py * (perp * g.len)
    ];
  }

  // path string for one segment: hand-bent quadratic when a bend exists and both
  // ends are on-screen; otherwise the normal sampled arc (great-circle / linear).
  function segmentPath(a, b) {
    const bend = state.bends[segKey(a, b)];
    if (bend && (bend.perp || (bend.along && bend.along !== 0.5)) &&
        isPointVisible(a.lng, a.lat) && isPointVisible(b.lng, b.lat)) {
      const g = segGeom(a, b);
      // skip the quad for very long (likely antimeridian-wrapping) spans
      if (g && g.len < width * 1.3) {
        const apex = bendApex(g, bend);
        const t = Math.min(0.85, Math.max(0.15, bend.along || 0.5));
        // control point so the curve passes through apex at parameter t
        const cx = (apex[0] - (1 - t) * (1 - t) * g.A[0] - t * t * g.B[0]) / (2 * (1 - t) * t);
        const cy = (apex[1] - (1 - t) * (1 - t) * g.A[1] - t * t * g.B[1]) / (2 * (1 - t) * t);
        return `M${g.A[0]},${g.A[1]} Q${cx},${cy} ${g.B[0]},${g.B[1]}`;
      }
    }
    return arcPath(a, b);
  }

  const bendDrag = d3.drag()
    .on("start", function(ev) {
      if (ev.sourceEvent) ev.sourceEvent.stopPropagation();
      d3.select(this).classed("grabbing", true);
    })
    .on("drag", function(ev, d) {
      const g = segGeom(d.a, d.b);
      if (!g) return;
      const rx = ev.x - g.A[0], ry = ev.y - g.A[1];
      const along = Math.min(0.85, Math.max(0.15, (rx * g.ux + ry * g.uy) / g.len));
      let perp = (rx * g.px + ry * g.py) / g.len;
      perp = Math.min(2.5, Math.max(-2.5, perp));
      state.bends[segKey(d.a, d.b)] = { along, perp };
      renderConnections();
    })
    .on("end", function() {
      d3.select(this).classed("grabbing", false);
      if (window.Panel && window.Panel.persist) window.Panel.persist();
    });

  function renderBendHandles(segs) {
    if (!state.bendEdit) { gHandle.selectAll("*").remove(); return; }
    const data = segs.filter(s =>
      isPointVisible(s.a.lng, s.a.lat) && isPointVisible(s.b.lng, s.b.lat) && segGeom(s.a, s.b)
    ).map(s => {
      const g = segGeom(s.a, s.b);
      const apex = bendApex(g, state.bends[segKey(s.a, s.b)]);
      return { a: s.a, b: s.b, key: segKey(s.a, s.b), x: apex[0], y: apex[1] };
    });

    const sel = gHandle.selectAll("circle.bend-handle").data(data, d => d.key);
    sel.exit().remove();
    const enter = sel.enter().append("circle")
      .attr("class", "bend-handle")
      .attr("r", 6.5)
      .call(bendDrag)
      .on("dblclick", function(ev, d) {
        if (ev.sourceEvent) ev.sourceEvent.stopPropagation();
        ev.stopPropagation();
        delete state.bends[d.key];
        renderConnections();
        if (window.Panel && window.Panel.persist) window.Panel.persist();
      });
    enter.merge(sel)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  // Sample N+1 [lng,lat] points along the path between two cities.
  //  • greatCircle off → linear interpolation in lng/lat (follows parallels,
  //    stays mid-latitude — the original behaviour).
  //  • greatCircle on  → spherical great-circle (slerp), the shortest path on
  //    the globe; for far-apart cities it naturally bows toward the pole
  //    (e.g. 大连→鹿特丹 peaks ≈64°N), i.e. an Arctic-leaning route.
  function interpPoints(a, b, N, forceGC) {
    if (forceGC || state.greatCircle) {
      const toRad = Math.PI / 180, toDeg = 180 / Math.PI;
      const la1 = a.lat * toRad, lo1 = a.lng * toRad;
      const la2 = b.lat * toRad, lo2 = b.lng * toRad;
      const v1 = [Math.cos(la1) * Math.cos(lo1), Math.cos(la1) * Math.sin(lo1), Math.sin(la1)];
      const v2 = [Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)];
      let dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
      dot = Math.max(-1, Math.min(1, dot));
      const omega = Math.acos(dot);
      const out = [];
      if (omega < 1e-6) {            // coincident points — nothing to arc
        for (let i = 0; i <= N; i++) out.push([a.lng, a.lat]);
        return out;
      }
      const sinO = Math.sin(omega);
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const s1 = Math.sin((1 - t) * omega) / sinO;
        const s2 = Math.sin(t * omega) / sinO;
        const x = v1[0] * s1 + v2[0] * s2;
        const y = v1[1] * s1 + v2[1] * s2;
        const z = v1[2] * s1 + v2[2] * s2;
        out.push([Math.atan2(y, x) * toDeg, Math.atan2(z, Math.hypot(x, y)) * toDeg]);
      }
      return out;
    }
    // shortest longitude path, linear in lng/lat
    let dlng = b.lng - a.lng;
    if (dlng > 180) dlng -= 360;
    else if (dlng < -180) dlng += 360;
    const out = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let lng = a.lng + dlng * t;
      lng = ((lng + 540) % 360) - 180;  // normalize back into [-180,180]
      out.push([lng, a.lat + (b.lat - a.lat) * t]);
    }
    return out;
  }

  // Build an SVG path from a list of [lng,lat] points, splitting at the
  // antimeridian and hiding the back of the globe. Shared by great-circle arcs
  // (interpolated) and pre-computed polylines (sea lanes).
  function pathFromLngLat(pts) {
    const segments = [[]];
    let prev = null;
    let prevVisible = true;
    for (let i = 0; i < pts.length; i++) {
      const ll = pts[i];
      const visible = isPointVisible(ll[0], ll[1]);
      if (prev !== null) {
        const wrap = Math.abs(ll[0] - prev[0]) > 180;
        if (wrap || visible !== prevVisible) segments.push([]);
      }
      if (visible) segments[segments.length - 1].push(ll);
      prev = ll;
      prevVisible = visible;
    }
    const line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
    return segments
      .map(seg => {
        const ps = seg.map(ll => projection(ll)).filter(p => p && !isNaN(p[0]));
        return ps.length > 1 ? line(ps) : null;
      })
      .filter(Boolean)
      .join(" ");
  }

  // arc — builds the SVG path. Handles antimeridian split and back-of-globe hide.
  function arcPath(a, b, forceGC) {
    return pathFromLngLat(interpPoints(a, b, 64, forceGC));
  }

  // ---------- REAL AIRLINE ROUTES (OpenFlights) ----------
  // 纯增量层：默认关闭，开关打开时才懒加载 air-network.json。数据是离线烘焙好的
  // 出向邻接表 { airports:{IATA:[lng,lat]}, routes:{IATA:[[dst,weight]]} }。
  let airNet = null;          // 加载后的网络数据
  let airNetPromise = null;   // 防重复 fetch
  const cityAirport = {};     // 城市名 → 匹配到的机场 IATA（null 表示附近没机场）

  function loadAirNet() {
    if (airNetPromise) return airNetPromise;
    airNetPromise = fetch(AIR_NET_URL)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => {
        airNet = d;
        matchCityAirports();
        if (state.showAirRoutes) { renderAirRoutes(); updateScaleCompensation(); }
        return d;
      })
      .catch(err => { console.warn("[air] 航线数据加载失败:", err); airNet = null; });
    return airNetPromise;
  }

  function haversineKm(lng1, lat1, lng2, lat2) {
    const R = 6371, toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad, dLng = (lng2 - lng1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // 把素材里每个城市匹配到一座机场：优先 100km 内最繁忙的枢纽，否则退而取
  // 250km 内最近的一座。只在数据加载后跑一次，结果缓存在 cityAirport。
  function matchCityAirports() {
    if (!airNet) return;
    Object.keys(cityAirport).forEach(k => delete cityAirport[k]);
    const aps = airNet.airports, routes = airNet.routes;
    const codes = Object.keys(aps);
    const cities = window.ALL_CITIES || window.CAPITALS;
    cities.forEach(c => {
      let bestNear = null, bestScore = -Infinity;
      let nearest = null, nearestDist = Infinity;
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i], ap = aps[code];
        const dist = haversineKm(c.lng, c.lat, ap[0], ap[1]);
        if (dist < nearestDist) { nearestDist = dist; nearest = code; }
        if (dist <= 100) {
          const deg = (routes[code] || []).length;
          const score = deg * 1000 - dist;   // 越繁忙越优先，同等距离更近优先
          if (score > bestScore) { bestScore = score; bestNear = code; }
        }
      }
      cityAirport[c.name] = bestNear || (nearestDist <= 250 ? nearest : null);
    });
  }

  function renderAirRoutes() {
    if (!gAir) return;
    if (!state.showAirRoutes || !airNet) { gAir.selectAll("*").remove(); return; }
    const aps = airNet.airports, routes = airNet.routes;
    const cap = Math.max(1, state.airMaxPerCity | 0);

    const lineData = [];
    const dests = new Map();   // dst IATA → [lng,lat]
    const seen = new Set();    // 同一 机场→目的地 只画一次
    state.selected.forEach(name => {
      const c = cityByName[name];
      const code = cityAirport[name];
      if (!c || !code) return;
      const edges = routes[code] || [];
      for (let i = 0; i < edges.length && i < cap; i++) {
        const dst = edges[i][0];
        const dp = aps[dst];
        if (!dp) continue;
        const key = code + ">" + dst;
        if (seen.has(key)) continue;
        seen.add(key);
        const d = arcPath(c, { lng: dp[0], lat: dp[1] }, true);  // 航线恒走大圆
        if (d) lineData.push(d);
        dests.set(dst, dp);
      }
    });

    const lines = gAir.selectAll("path.air-route").data(lineData);
    lines.exit().remove();
    lines.enter().append("path").attr("class", "air-route")
      .merge(lines).attr("d", d => d);

    const dots = gAir.selectAll("circle.air-dot").data([...dests.entries()], d => d[0]);
    dots.exit().remove();
    dots.enter().append("circle").attr("class", "air-dot")
      .merge(dots)
      .attr("cx", d => { const p = projectSafe({ lng: d[1][0], lat: d[1][1] }); return p ? p[0] : -9999; })
      .attr("cy", d => { const p = projectSafe({ lng: d[1][0], lat: d[1][1] }); return p ? p[1] : -9999; })
      .style("display", d => isPointVisible(d[1][0], d[1][1]) ? null : "none");
  }

  // ---------- REAL SHIPPING LANES (searoute) ----------
  // 全球主干航道网络，与城市选择无关：开关打开即画整张航海图。数据是离线烘焙好的
  // 折线 { ports:{名:[lng,lat]}, lanes:[{from,to,pts:[[lng,lat]]}] }。
  let seaNet = null;
  let seaNetPromise = null;

  function loadSeaNet() {
    if (seaNetPromise) return seaNetPromise;
    seaNetPromise = fetch(SEA_NET_URL)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => {
        seaNet = d;
        if (state.showSeaRoutes) { renderSeaRoutes(); updateScaleCompensation(); }
        return d;
      })
      .catch(err => { console.warn("[sea] 航道数据加载失败:", err); seaNet = null; });
    return seaNetPromise;
  }

  function renderSeaRoutes() {
    if (!gSea) return;
    if (!state.showSeaRoutes || !seaNet) { gSea.selectAll("*").remove(); return; }
    const lanes = seaNet.lanes || [];
    const lineData = lanes.map(l => pathFromLngLat(l.pts)).filter(Boolean);

    const lines = gSea.selectAll("path.sea-route").data(lineData);
    lines.exit().remove();
    lines.enter().append("path").attr("class", "sea-route")
      .merge(lines).attr("d", d => d);

    // animated dashed overlay on top of the faint solid base (shares the global
    // flow offset + the 连线流动 speed/animate controls).
    const flow = gSea.selectAll("path.sea-flow").data(lineData);
    flow.exit().remove();
    flow.enter().append("path").attr("class", "sea-flow")
      .merge(flow).attr("d", d => d);

    const portData = Object.entries(seaNet.ports || {});
    const dots = gSea.selectAll("circle.sea-dot").data(portData, d => d[0]);
    dots.exit().remove();
    dots.enter().append("circle").attr("class", "sea-dot")
      .merge(dots)
      .attr("cx", d => { const p = projectSafe({ lng: d[1][0], lat: d[1][1] }); return p ? p[0] : -9999; })
      .attr("cy", d => { const p = projectSafe({ lng: d[1][0], lat: d[1][1] }); return p ? p[1] : -9999; })
      .style("display", d => isPointVisible(d[1][0], d[1][1]) ? null : "none");
  }

  // ---------- COUNTRY SEARCH + GROUPING ----------
  function normalizeCountryQuery(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
      .trim();
  }

  function isChinaTerritoryId(id) {
    return CHINA_TERRITORY_IDS.has(String(id));
  }

  function getFeatureById(id) {
    if (!countriesFeatures) return null;
    return countriesFeatures.find(f => String(f.id) === String(id)) || null;
  }

  function getResolvedFeatureId(id) {
    const feature = getFeatureById(id);
    return feature ? feature.id : id;
  }

  function getCountryHighlightIds(id) {
    if (!countriesFeatures) return [id];
    if (isChinaTerritoryId(id) || id === "china-territory") {
      return Array.from(CHINA_TERRITORY_IDS)
        .map(getResolvedFeatureId)
        .filter(resolvedId => countriesFeatures.some(f => f.id === resolvedId));
    }
    return [getResolvedFeatureId(id)];
  }

  function hasChinaTerritoryHighlight() {
    return Array.from(state.highlighted).some(id => isChinaTerritoryId(id));
  }

  function countryRawName(feature) {
    return feature?.properties?.name || "";
  }

  function countryDisplayName(feature) {
    if (!feature) return "";
    if (String(feature.id) === "156") return "中国";
    if (String(feature.id) === "158") return "中国台湾";
    return countryRawName(feature);
  }

  function chinaSearchMatches(query) {
    if (!query) return false;
    return CHINA_SEARCH_ALIASES.some(alias => normalizeCountryQuery(alias).includes(query) || query.includes(normalizeCountryQuery(alias)));
  }

  function countryMatchesQuery(feature, query) {
    const raw = normalizeCountryQuery(countryRawName(feature));
    const display = normalizeCountryQuery(countryDisplayName(feature));
    const id = String(feature.id || "").toLowerCase();
    return raw.includes(query) || display.includes(query) || id.includes(query);
  }

  function countrySearchItems(query, limit) {
    if (!countriesFeatures) return [];
    const q = normalizeCountryQuery(query);
    const max = limit || 12;
    if (!q) return [];

    const results = [];
    const seen = new Set();
    const chinaIds = getCountryHighlightIds("china-territory");
    const pushChinaGroup = () => {
      if (seen.has("china-territory")) return;
      seen.add("china-territory");
      results.push({
        id: "china-territory",
        name: "中国",
        detail: "包含中国大陆、台湾和南海诸岛标记",
        highlighted: chinaIds.length > 0 && chinaIds.every(id => state.highlighted.has(id))
      });
    };

    if (chinaSearchMatches(q)) pushChinaGroup();

    countriesFeatures
      .filter(feature => countryMatchesQuery(feature, q))
      .sort((a, b) => countryDisplayName(a).localeCompare(countryDisplayName(b)))
      .forEach(feature => {
        if (isChinaTerritoryId(feature.id)) {
          pushChinaGroup();
          return;
        }
        const key = String(feature.id);
        if (seen.has(key)) return;
        seen.add(key);
        const ids = getCountryHighlightIds(feature.id);
        results.push({
          id: feature.id,
          name: countryDisplayName(feature),
          detail: countryRawName(feature),
          highlighted: ids.length > 0 && ids.every(id => state.highlighted.has(id))
        });
      });

    return results.slice(0, max);
  }

  function toggleCountryHighlightById(id, opts) {
    opts = opts || {};
    const ids = getCountryHighlightIds(id);
    const active = ids.length > 0 && ids.every(featureId => state.highlighted.has(featureId));
    if (opts.replace) state.highlighted.clear();
    if (active && !opts.forceOn) ids.forEach(featureId => state.highlighted.delete(featureId));
    else ids.forEach(featureId => state.highlighted.add(featureId));

    const focusFeature = id === "china-territory" ? getFeatureById("156") : getFeatureById(id);
    if (focusFeature) {
      const center = d3.geoCentroid(focusFeature);
      state.lastTarget = { lng: center[0], lat: center[1] };
      if (state.autoFocus || opts.focus) focusOn(center[0], center[1]);
    }
    updateCountryHighlight();
  }

  // ---------- COUNTRY HIGHLIGHT (animated outline trace, then fill) ----------
  function playTraceAndFill(el, d) {
    const path = d3.select(el);
    let len = 800;
    try { len = el.getTotalLength() || 800; } catch (e) {}
    const totalMs = state.highlightDuration * 1000;
    const traceMs = totalMs * 0.65;
    const fillMs  = totalMs * 0.35;

    path.classed("filled", false);
    path.style("transition", "none")
        .style("stroke-dasharray", len)
        .style("stroke-dashoffset", len);
    // force reflow so the next style change actually transitions
    // eslint-disable-next-line no-unused-expressions
    el.getBoundingClientRect();
    requestAnimationFrame(() => {
      path.style("transition",
        `stroke-dashoffset ${traceMs/1000}s cubic-bezier(.6,0,.2,1), fill ${fillMs/1000}s ease`);
      path.style("stroke-dashoffset", 0);
    });
    // store a per-element timer so we can cancel on exit / re-run
    if (el.__fillTimer) clearTimeout(el.__fillTimer);
    el.__fillTimer = setTimeout(() => {
      if (state.highlighted.has(d.id) && !d3.select(el).classed("removing")) {
        d3.select(el).classed("filled", true);
      }
    }, traceMs);
  }

  function updateCountryHighlight() {
    if (!countriesFeatures) return;
    const list = countriesFeatures.filter(f => state.highlighted.has(f.id));
    const sel = gHighlight.selectAll("path.country-highlight").data(list, d => d.id);

    // EXIT: fade fill out, retract stroke, remove
    sel.exit().each(function() {
      const el = this;
      const path = d3.select(el);
      if (path.classed("removing")) return;
      if (el.__fillTimer) clearTimeout(el.__fillTimer);
      path.classed("removing", true).classed("filled", false);
      setTimeout(() => {
        try {
          const len = el.getTotalLength ? el.getTotalLength() : 800;
          path.style("transition", "stroke-dashoffset .45s ease");
          path.style("stroke-dashoffset", len);
        } catch (e) {}
        setTimeout(() => { try { path.remove(); } catch (e) {} }, 500);
      }, 220);
    });

    // ENTER: append path then run the trace+fill animation
    sel.enter().append("path")
      .attr("class", "country-highlight")
      .attr("d", pathGen)
      .each(function(d) { playTraceAndFill(this, d); });

    updateSouthSeaHighlight();
    updateScaleCompensation();
    restartLoopTimerIfEnabled();
  }

  function updateSouthSeaHighlight() {
    const data = hasChinaTerritoryHighlight() ? SOUTH_CHINA_SEA_ISLANDS : [];
    const sel = gSouthSea.selectAll("g.south-sea-highlight").data(data, d => d.id);

    sel.exit()
      .classed("removing", true)
      .transition()
      .duration(220)
      .style("opacity", 0)
      .remove();

    const entered = sel.enter().append("g")
      .attr("class", "south-sea-highlight")
      .style("opacity", 0);
    entered.append("circle").attr("class", "south-sea-halo");
    entered.append("circle").attr("class", "south-sea-dot");
    entered.append("text")
      .attr("class", "south-sea-label")
      .attr("x", 8)
      .attr("y", -8)
      .text(d => d.name);

    const merged = entered.merge(sel);
    merged
      .attr("transform", d => {
        const p = projectSafe(d);
        return p ? `translate(${p[0]},${p[1]})` : "translate(-9999,-9999)";
      })
      .style("display", d => isPointVisible(d.lng, d.lat) ? null : "none")
      .transition()
      .duration(220)
      .style("opacity", 1);
  }

  // Replay animation on all currently-highlighted countries
  function replayHighlights() {
    if (!countriesFeatures) return;
    gHighlight.selectAll("path.country-highlight").each(function(d) {
      if (!d3.select(this).classed("removing")) {
        playTraceAndFill(this, d);
      }
    });
    updateSouthSeaHighlight();
    restartLoopTimerIfEnabled();
  }

  // Loop timer
  let loopTimer = null;
  function restartLoopTimerIfEnabled() {
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    if (!state.highlightLoop) return;
    const iv = (state.highlightDuration + state.highlightLoopInterval) * 1000;
    loopTimer = setInterval(() => {
      // only loop if at least one is highlighted
      if (state.highlighted.size > 0) replayHighlights();
    }, Math.max(800, iv));
  }

  // Called from redrawWorld whenever projection changes
  function syncHighlightPaths() {
    gHighlight.selectAll("path.country-highlight").each(function() {
      const el = this;
      const path = d3.select(el);
      if (path.classed("removing")) return;
      path.attr("d", pathGen);
      try {
        const len = el.getTotalLength() || 800;
        path.style("transition", "none")
            .style("stroke-dasharray", len);
        if (path.classed("filled")) {
          path.style("stroke-dashoffset", 0);
        }
        requestAnimationFrame(() => {
          const totalMs = state.highlightDuration * 1000;
          path.style("transition",
            `stroke-dashoffset ${(totalMs*0.65)/1000}s cubic-bezier(.6,0,.2,1), fill ${(totalMs*0.35)/1000}s ease`);
        });
      } catch (e) {}
    });
    updateSouthSeaHighlight();
  }

  // ---------- FOCUS ANIMATION ----------
  let focusRaf = null;
  function focusOn(lng, lat, opts) {
    opts = opts || {};
    const duration = (opts.duration != null ? opts.duration : state.focusDuration) * 1000;
    const targetZoom = opts.zoom != null ? opts.zoom : state.focusZoom;

    state.lastTarget = { lng, lat };

    if (focusRaf) cancelAnimationFrame(focusRaf);

    if (state.mode === "globe") {
      // Pause auto-rotate while focusing
      const wasAutoRot = state.autoRotate;
      state.autoRotate = false;

      const r0 = state.rotation.slice();
      // shortest-path λ
      let dLambda = (-lng) - r0[0];
      while (dLambda > 180) dLambda -= 360;
      while (dLambda < -180) dLambda += 360;
      const targetLambda = r0[0] + dLambda;
      const targetPhi = -lat;
      const s0 = projection.scale();
      const baseScale = Math.min(width, height) / 2.4;
      const sTarget = baseScale * targetZoom * 0.55; // a bit less zoomy for globe

      const t0 = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - t0) / duration);
        const k = d3.easeCubicInOut(t);
        state.rotation = [
          r0[0] + (targetLambda - r0[0]) * k,
          r0[1] + (targetPhi - r0[1]) * k,
          r0[2]
        ];
        projection.scale(s0 + (sTarget - s0) * k);
        projectionGlobe.rotate(state.rotation);
        pathGen = d3.geoPath(projection);
        redrawWorld();
        renderCities();
        renderConnections();
        if (t < 1) focusRaf = requestAnimationFrame(tick);
        else { state.autoRotate = wasAutoRot; }
      }
      focusRaf = requestAnimationFrame(tick);
    } else {
      // flat: pan-zoom to target via d3-zoom transform
      const k = Math.min(10, Math.max(targetZoom, 1.5));
      const [px, py] = projectionFlat([lng, lat]);
      if (px == null || isNaN(px)) return;
      const tx = width/2 - px * k;
      const ty = height/2 - py * k;
      const transform = d3.zoomIdentity.translate(tx, ty).scale(k);
      svg.transition()
        .duration(duration)
        .ease(d3.easeCubicInOut)
        .call(zoomBehavior.transform, transform);
    }
  }

  function focusOnLast() {
    if (!state.lastTarget) return;
    focusOn(state.lastTarget.lng, state.lastTarget.lat);
  }

  // ---------- FLOW ANIMATION ----------
  let flowOffset = 0;
  let flowRaf = null;
  function startFlowAnimation() {
    let last = performance.now();
    function tick(now) {
      const dt = now - last; last = now;
      if (state.animate && state.lineSpeed > 0) {
        flowOffset -= dt * 0.04 * state.lineSpeed;
        gConnFlow.selectAll("path.connection-flow")
          .style("stroke-dashoffset", flowOffset);
        gSea.selectAll("path.sea-flow")
          .style("stroke-dashoffset", flowOffset);
      }
      flowRaf = requestAnimationFrame(tick);
    }
    if (flowRaf) cancelAnimationFrame(flowRaf);
    flowRaf = requestAnimationFrame(tick);
  }

  function startAutoRotateLoop() {
    let last = performance.now();
    function tick(now) {
      const dt = now - last; last = now;
      if (state.mode === "globe" && state.autoRotate && state.rotateSpeed > 0) {
        state.rotation[0] += dt * 0.015 * state.rotateSpeed;
        projectionGlobe.rotate(state.rotation);
        redrawWorld();
        renderCities();
        renderConnections();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- THEME ----------
  function setTheme(t) {
    const root = document.documentElement.style;
    root.setProperty("--c-bg",          t.bg || t.water);
    root.setProperty("--c-water",       t.water);
    root.setProperty("--c-land",        t.land);
    root.setProperty("--c-land-stroke", t.landStroke);
    root.setProperty("--c-border",      t.border);
    root.setProperty("--c-graticule",   t.graticule);
    root.setProperty("--c-city-fill",   t.cityFill);
    root.setProperty("--c-city-ring",   t.cityRing);
    root.setProperty("--c-city-halo",   t.cityHalo);
    root.setProperty("--c-label",       t.label);
    root.setProperty("--c-label-halo",  t.labelHalo);
    root.setProperty("--c-line",        t.line);
    root.setProperty("--c-line-glow",   t.lineGlow);
    root.setProperty("--c-pulse",       t.pulse);
    root.setProperty("--c-highlight-fill",   t.highlightFill   || t.line);
    root.setProperty("--c-highlight-stroke", t.highlightStroke || t.line);
    root.setProperty("--c-sea",              t.sea || "#18b6c9");
  }

  // ---------- API ----------
  function setSelected(arr) {
    state.selected = arr.slice();
    renderCities();
    renderConnections();
  }
  function setShowLabels(v)    { state.showLabels    = !!v; updateSelectionVisuals(); }
  function setShowLabelEn(v)    { state.showLabelEn   = !!v; renderCities(); }
  function setShowAllDots(v)   { state.showAllDots   = !!v; updateSelectionVisuals(); }
  function setShowGraticule(v) { state.showGraticule = !!v; gGrat.style("display", v ? null : "none"); }
  function setShowMajor(v)     { state.showMajor     = !!v; renderCities(); renderConnections(); }
  function setLineSpeed(v)     { state.lineSpeed = +v; }
  function setAnimate(v)       { state.animate = !!v; }
  function setShowRoute(v)     { state.showRoute = !!v; renderConnections(); }
  function setGreatCircle(v)   { state.greatCircle = !!v; renderConnections(); }
  function setShowAirRoutes(v) {
    state.showAirRoutes = !!v;
    if (state.showAirRoutes) loadAirNet();   // 懒加载：第一次打开才拉全量数据
    renderAirRoutes();
    updateScaleCompensation();
  }
  function setAirMaxPerCity(v) {
    state.airMaxPerCity = Math.max(1, +v | 0);
    renderAirRoutes();
    updateScaleCompensation();
  }
  function setShowSeaRoutes(v) {
    state.showSeaRoutes = !!v;
    if (state.showSeaRoutes) loadSeaNet();
    renderSeaRoutes();
    updateScaleCompensation();
  }
  function setBendEdit(v)      { state.bendEdit = !!v; renderConnections(); }
  function setBends(obj)       { state.bends = (obj && typeof obj === "object") ? obj : {}; renderConnections(); }
  function getBends()          { return state.bends; }
  function clearBends()        { state.bends = {}; renderConnections(); }
  function setAutoRotate(v)    { state.autoRotate = !!v; }
  function setRotateSpeed(v)   { state.rotateSpeed = +v; }
  function clearHighlights()   { state.highlighted.clear(); updateCountryHighlight(); }

  // animation timing setters
  function setHighlightDuration(v) {
    state.highlightDuration = +v;
    restartLoopTimerIfEnabled();
  }
  function setHighlightLoop(v) {
    state.highlightLoop = !!v;
    restartLoopTimerIfEnabled();
  }
  function setHighlightLoopInterval(v) {
    state.highlightLoopInterval = +v;
    restartLoopTimerIfEnabled();
  }
  function setFocusDuration(v) { state.focusDuration = +v; }
  function setAutoFocus(v)     { state.autoFocus = !!v; }
  function setFocusZoom(v)     { state.focusZoom = +v; }

  // ---------- ZOOM CONTROLS ----------
  function zoomIn() {
    if (state.mode === "flat") {
      svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.6);
    } else {
      projection.scale(projection.scale() * 1.25);
      redrawWorld(); renderCities(); renderConnections();
    }
  }
  function zoomOut() {
    if (state.mode === "flat") {
      svg.transition().duration(250).call(zoomBehavior.scaleBy, 1/1.6);
    } else {
      projection.scale(projection.scale() / 1.25);
      redrawWorld(); renderCities(); renderConnections();
    }
  }
  function resetView() {
    if (state.mode === "flat") {
      svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);
    } else {
      state.rotation = [0, -20, 0];
      projectionGlobe
        .rotate(state.rotation)
        .scale(Math.min(width, height) / 2.4);
      redrawWorld(); renderCities(); renderConnections();
    }
  }

  function fitToSelection() {
    if (state.selected.length < 1) return;
    if (state.mode === "globe") {
      // rotate globe to center of selected
      const pts = state.selected.map(n => cityByName[n]).filter(Boolean);
      const meanLng = pts.reduce((s,c) => s + c.lng, 0) / pts.length;
      const meanLat = pts.reduce((s,c) => s + c.lat, 0) / pts.length;
      state.rotation = [-meanLng, -meanLat, 0];
      projectionGlobe.rotate(state.rotation);
      redrawWorld(); renderCities(); renderConnections();
      return;
    }
    const pts = state.selected.map(n => {
      const c = cityByName[n];
      return c ? projection([c.lng, c.lat]) : null;
    }).filter(Boolean);
    if (pts.length === 0) return;
    let xMin=Infinity, yMin=Infinity, xMax=-Infinity, yMax=-Infinity;
    pts.forEach(p => { xMin=Math.min(xMin,p[0]); yMin=Math.min(yMin,p[1]); xMax=Math.max(xMax,p[0]); yMax=Math.max(yMax,p[1]); });
    const pad = 100;
    const dx = (xMax - xMin) + pad*2;
    const dy = (yMax - yMin) + pad*2;
    const cx = (xMin + xMax)/2;
    const cy = (yMin + yMax)/2;
    const k = Math.min(8, 0.95 / Math.max(dx/width, dy/height));
    const t = d3.zoomIdentity.translate(width/2 - cx*k, height/2 - cy*k).scale(k);
    svg.transition().duration(600).call(zoomBehavior.transform, t);
  }

  window.WorldMap = {
    init, setTheme, setSelected, setShowLabels, setShowLabelEn, setShowAllDots, setShowGraticule,
    setShowMajor, setLineSpeed, setAnimate, setShowRoute, setGreatCircle, setShowAirRoutes, setAirMaxPerCity,
    setShowSeaRoutes, setAutoRotate, setRotateSpeed,
    setBendEdit, setBends, getBends, clearBends,
    setMode, clearHighlights,
    // animation
    setHighlightDuration, setHighlightLoop, setHighlightLoopInterval,
    setFocusDuration, setAutoFocus, setFocusZoom,
    replayHighlights, focusOn, focusOnLast,
    // helpers for panel
    findCountryByName: (name) => {
      if (!countriesFeatures) return null;
      const q = String(name || "").toLowerCase();
      return countriesFeatures.find(f => (f.properties?.name || "").toLowerCase() === q) || null;
    },
    searchCountries: countrySearchItems,
    toggleCountryHighlightById,
    highlightCountryById: (id, opts) => toggleCountryHighlightById(id, { ...(opts || {}), forceOn: true }),
    addHighlightById: (id) => { getCountryHighlightIds(id).forEach(featureId => state.highlighted.add(featureId)); updateCountryHighlight(); },
    zoomIn, zoomOut, resetView, fitToSelection,
    getState: () => ({ ...state, highlighted: [...state.highlighted] })
  };
})();
