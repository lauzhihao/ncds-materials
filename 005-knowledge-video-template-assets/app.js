(function () {
  const ASSET_ROOT = "005-knowledge-video-template-assets";
  const SCENE_ACCENTS = [
    "#59d0ff",
    "#7adfb7",
    "#f8b85b",
    "#ff9f67",
    "#7bb8ff",
    "#94f0c2",
    "#59d0ff"
  ];

  const state = {
    story: null,
    datasets: null,
    atlas: null,
    duration: 180,
    currentTime: 0,
    isPlaying: false,
    lastTimestamp: 0,
    currentSceneIndex: -1,
    activeScene: null,
    chartRefs: [],
    timelineRefs: [],
    metricRefs: [],
    bulletRefs: [],
    cardRefs: [],
    map: {
      routes: [],
      cities: new Map(),
      labels: {}
    }
  };

  const dom = {};

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const bigint = Number.parseInt(normalized, 16);
    return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const remain = String(safe % 60).padStart(2, "0");
    return `${minutes}:${remain}`;
  }

  function routePath(start, end, weight) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const distance = Math.hypot(dx, dy) || 1;
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const lift = Math.max(36, distance * (0.11 + weight * 0.12));
    const controlX = midX + normalX * lift;
    const controlY = midY + normalY * lift - distance * 0.08;
    return `M${start[0]},${start[1]} Q${controlX},${controlY} ${end[0]},${end[1]}`;
  }

  function getLabelOffset(cityId) {
    const offsets = {
      "shanghai": [12, -10],
      "shenzhen": [10, 16],
      "singapore": [12, 16],
      "hochiminh": [12, 16],
      "bangkok": [12, -8],
      "chennai": [12, 14],
      "bangalore": [12, -10],
      "dubai": [12, -10],
      "rotterdam": [12, -10],
      "hamburg": [12, 16],
      "warsaw": [12, -8],
      "istanbul": [12, 14],
      "monterrey": [12, -12],
      "houston": [12, 16],
      "los-angeles": [12, -10]
    };
    return offsets[cityId] || [12, -10];
  }

  function cacheDom() {
    dom.videoStage = document.getElementById("videoStage");
    dom.chapterTag = document.getElementById("chapterTag");
    dom.sceneLabel = document.getElementById("sceneLabel");
    dom.outputSpec = document.getElementById("outputSpec");
    dom.stageKicker = document.getElementById("stageKicker");
    dom.stageTitle = document.getElementById("stageTitle");
    dom.stageBody = document.getElementById("stageBody");
    dom.metricRow = document.getElementById("metricRow");
    dom.bulletList = document.getElementById("bulletList");
    dom.insightGrid = document.getElementById("insightGrid");
    dom.chartPanel = document.querySelector(".chart-panel");
    dom.chartKicker = document.getElementById("chartKicker");
    dom.chartTitle = document.getElementById("chartTitle");
    dom.chartCaption = document.getElementById("chartCaption");
    dom.chartSvg = document.getElementById("chartSvg");
    dom.timelinePanel = document.querySelector(".timeline-panel");
    dom.timelineKicker = document.getElementById("timelineKicker");
    dom.timelineTitle = document.getElementById("timelineTitle");
    dom.timelineTrack = document.getElementById("timelineTrack");
    dom.timelineCaption = document.getElementById("timelineCaption");
    dom.sceneSummary = document.getElementById("sceneSummary");
    dom.dataNotice = document.getElementById("dataNotice");
    dom.avatarDock = document.getElementById("avatarDock");
    dom.avatarSpotlight = document.getElementById("avatarSpotlight");
    dom.avatarWaveBars = Array.from(document.querySelectorAll(".avatar-wave span"));
    dom.progressFill = document.getElementById("progressFill");
    dom.currentTimeLabel = document.getElementById("currentTimeLabel");
    dom.sceneTimeLabel = document.getElementById("sceneTimeLabel");
    dom.controlTitle = document.getElementById("controlTitle");
    dom.controlDescription = document.getElementById("controlDescription");
    dom.playPauseButton = document.getElementById("playPauseButton");
    dom.restartButton = document.getElementById("restartButton");
    dom.cleanModeButton = document.getElementById("cleanModeButton");
    dom.timelineInput = document.getElementById("timelineInput");
    dom.playbackState = document.getElementById("playbackState");
    dom.sceneList = document.getElementById("sceneList");
    dom.sceneCounter = document.getElementById("sceneCounter");
    dom.voiceoverCopy = document.getElementById("voiceoverCopy");
    dom.worldMapSvg = document.getElementById("worldMapSvg");
    dom.gridLayer = document.getElementById("gridLayer");
    dom.countryLayer = document.getElementById("countryLayer");
    dom.routeBaseLayer = document.getElementById("routeBaseLayer");
    dom.routeFlowLayer = document.getElementById("routeFlowLayer");
    dom.cityLayer = document.getElementById("cityLayer");
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    return response.json();
  }

  function setAccent(index) {
    const accent = SCENE_ACCENTS[index % SCENE_ACCENTS.length];
    dom.videoStage.style.setProperty("--accent", accent);
    dom.videoStage.style.setProperty("--accent-rgb", hexToRgb(accent));
  }

  function toggleVisibility(element, visible) {
    element.classList.toggle("is-hidden", !visible);
  }

  function renderMetrics(metrics) {
    dom.metricRow.innerHTML = "";
    dom.metricRefs = metrics.map((metric) => {
      const card = document.createElement("article");
      card.className = "metric-card";
      card.innerHTML = `
        <span class="metric-label">${metric.label}</span>
        <span class="metric-value">${metric.value}</span>
      `;
      dom.metricRow.appendChild(card);
      return card;
    });
  }

  function renderBullets(bullets) {
    dom.bulletList.innerHTML = "";
    dom.bulletRefs = bullets.map((bullet) => {
      const item = document.createElement("li");
      item.textContent = bullet;
      dom.bulletList.appendChild(item);
      return item;
    });
  }

  function renderCards(cards) {
    dom.insightGrid.innerHTML = "";
    dom.cardRefs = cards.map((card) => {
      const item = document.createElement("article");
      item.className = "insight-card";
      item.innerHTML = `
        <h4>${card.title}</h4>
        <p>${card.text}</p>
      `;
      dom.insightGrid.appendChild(item);
      return item;
    });
  }

  function renderChart(dataset) {
    const svg = d3.select(dom.chartSvg);
    svg.selectAll("*").remove();

    dom.chartKicker.textContent = dataset.kicker;
    dom.chartTitle.textContent = dataset.title;
    dom.chartCaption.textContent = dataset.caption;

    const width = 640;
    const top = 44;
    const left = 196;
    const right = 600;
    const barHeight = 30;
    const gap = 34;
    const scale = d3.scaleLinear().domain([0, dataset.max || 100]).range([0, right - left]);

    svg.append("line")
      .attr("class", "chart-axis-line")
      .attr("x1", left)
      .attr("y1", 24)
      .attr("x2", left)
      .attr("y2", 338);

    [25, 50, 75, 100].forEach((tick) => {
      const x = left + scale(tick);
      svg.append("line")
        .attr("class", "chart-grid-line")
        .attr("x1", x)
        .attr("y1", 24)
        .attr("x2", x)
        .attr("y2", 338);

      svg.append("text")
        .attr("class", "chart-note")
        .attr("x", x)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .text(`${tick}`);
    });

    state.chartRefs = dataset.items.map((item, index) => {
      const y = top + index * (barHeight + gap);
      svg.append("text")
        .attr("class", "chart-name")
        .attr("x", 24)
        .attr("y", y + 19)
        .text(item.label);

      svg.append("text")
        .attr("class", "chart-note")
        .attr("x", 24)
        .attr("y", y + 38)
        .text(item.note || "");

      svg.append("rect")
        .attr("class", "chart-bar-bg")
        .attr("x", left)
        .attr("y", y)
        .attr("width", right - left)
        .attr("height", barHeight)
        .attr("rx", 14);

      const fill = svg.append("rect")
        .attr("class", "chart-bar-fill")
        .attr("x", left)
        .attr("y", y)
        .attr("width", 0)
        .attr("height", barHeight)
        .attr("rx", 14);

      const value = svg.append("text")
        .attr("class", "chart-value")
        .attr("x", width - 22)
        .attr("y", y + 20)
        .attr("text-anchor", "end")
        .text("0");

      return {
        fill,
        value,
        targetWidth: scale(item.value),
        targetValue: item.value
      };
    });
  }

  function updateChartProgress(sceneProgress) {
    if (!state.chartRefs.length) {
      return;
    }

    state.chartRefs.forEach((ref, index) => {
      const staggered = clamp((sceneProgress - index * 0.08) / 0.45, 0, 1);
      const eased = easeOutCubic(staggered);
      ref.fill.attr("width", ref.targetWidth * eased);
      ref.value.text(String(Math.round(ref.targetValue * eased)));
    });
  }

  function renderTimeline(timeline) {
    dom.timelineKicker.textContent = timeline.kicker;
    dom.timelineTitle.textContent = timeline.title;
    dom.timelineCaption.textContent = timeline.caption;
    dom.timelineTrack.innerHTML = "";

    state.timelineRefs = timeline.items.map((item) => {
      const node = document.createElement("article");
      node.className = "timeline-item";
      node.innerHTML = `
        <span class="timeline-dot"></span>
        <span class="timeline-year">${item.year}</span>
        <div class="timeline-card">
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </div>
      `;
      dom.timelineTrack.appendChild(node);
      return node;
    });
  }

  function updateTimelineProgress(sceneProgress) {
    state.timelineRefs.forEach((item, index) => {
      const staggered = clamp((sceneProgress - index * 0.1) / 0.36, 0, 1);
      const eased = easeOutCubic(staggered);
      item.style.opacity = String(0.22 + eased * 0.78);
      item.style.transform = `translateY(${(1 - eased) * 12}px)`;
    });
  }

  function updateReveal(nodes, sceneProgress, step) {
    nodes.forEach((node, index) => {
      const staggered = clamp((sceneProgress - index * step) / 0.28, 0, 1);
      const eased = easeOutCubic(staggered);
      node.style.opacity = String(0.12 + eased * 0.88);
      node.style.transform = `translateY(${(1 - eased) * 10}px)`;
    });
  }

  function buildMap() {
    const countries = topojson.feature(state.atlas, state.atlas.objects.countries);
    const projection = d3.geoNaturalEarth1().fitExtent([[220, 110], [1710, 920]], countries);
    const path = d3.geoPath(projection);
    state.map.projection = projection;

    const gridSelection = d3.select(dom.gridLayer);
    gridSelection.selectAll("*").remove();
    gridSelection.append("path")
      .attr("class", "grid-line")
      .attr("d", path(d3.geoGraticule10()));

    const countrySelection = d3.select(dom.countryLayer);
    countrySelection.selectAll("*").remove();
    countrySelection.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "country-shape")
      .attr("d", path);

    const citiesById = {};
    state.datasets.map.cities.forEach((city) => {
      citiesById[city.id] = city;
    });

    state.map.routes = [];
    state.map.cities = new Map();

    const routeBaseLayer = d3.select(dom.routeBaseLayer);
    const routeFlowLayer = d3.select(dom.routeFlowLayer);
    const cityLayer = d3.select(dom.cityLayer);
    routeBaseLayer.selectAll("*").remove();
    routeFlowLayer.selectAll("*").remove();
    cityLayer.selectAll("*").remove();

    state.datasets.map.routes.forEach((route, index) => {
      const from = citiesById[route.from];
      const to = citiesById[route.to];
      if (!from || !to) {
        return;
      }

      const start = projection(from.coords);
      const end = projection(to.coords);
      const d = routePath(start, end, route.weight || 0.5);

      const base = routeBaseLayer.append("path")
        .attr("class", "route-base")
        .attr("d", d)
        .attr("opacity", 0.18);

      const flow = routeFlowLayer.append("path")
        .attr("class", "route-flow")
        .attr("d", d)
        .attr("opacity", 0.12);

      const length = flow.node().getTotalLength();
      flow.attr("stroke-dasharray", `${Math.max(24, length * 0.16)} ${Math.max(72, length * 0.84)}`);

      const pulse = routeFlowLayer.append("circle")
        .attr("r", 4)
        .attr("fill", "rgba(247, 251, 255, 0.95)")
        .attr("opacity", 0.12);

      state.map.routes.push({
        index,
        from: route.from,
        to: route.to,
        group: route.group,
        weight: route.weight || 0.5,
        path: flow.node(),
        base,
        flow,
        pulse,
        length
      });
    });

    state.datasets.map.cities.forEach((city, index) => {
      const [x, y] = projection(city.coords);
      const [dx, dy] = getLabelOffset(city.id);

      const group = cityLayer.append("g")
        .attr("class", "city-group");

      const halo = group.append("circle")
        .attr("class", "city-halo")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 8)
        .attr("opacity", 0.14);

      const core = group.append("circle")
        .attr("class", "city-core")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 3);

      group.append("text")
        .attr("class", "city-label")
        .attr("x", x + dx)
        .attr("y", y + dy)
        .text(city.label);

      group.append("text")
        .attr("class", "city-label-muted")
        .attr("x", x + dx)
        .attr("y", y + dy + 14)
        .text(city.en);

      state.map.cities.set(city.id, {
        index,
        group,
        halo,
        core,
        phase: index * 0.6
      });
    });
  }

  function applyScene(sceneIndex) {
    const scene = state.story.scenes[sceneIndex];
    const chart = scene.chartKey ? state.datasets.charts[scene.chartKey] : null;
    const timeline = scene.timelineKey ? state.datasets.timelines[scene.timelineKey] : null;

    setAccent(sceneIndex);
    state.activeScene = scene;
    state.currentSceneIndex = sceneIndex;

    dom.chapterTag.textContent = scene.chapter;
    dom.sceneLabel.textContent = scene.label;
    dom.stageKicker.textContent = scene.kicker;
    dom.stageTitle.textContent = scene.title;
    dom.stageBody.textContent = scene.body;
    dom.sceneSummary.textContent = scene.summary;
    dom.voiceoverCopy.textContent = scene.voiceover;
    dom.sceneCounter.textContent = `${sceneIndex + 1} / ${state.story.scenes.length}`;
    dom.sceneTimeLabel.textContent = `${formatTime(scene.start)} - ${formatTime(scene.end)}`;

    renderMetrics(scene.metrics || []);
    renderBullets(scene.bullets || []);
    renderCards(scene.cards || []);

    toggleVisibility(dom.chartPanel, Boolean(chart));
    if (chart) {
      renderChart(chart);
    } else {
      state.chartRefs = [];
      d3.select(dom.chartSvg).selectAll("*").remove();
      dom.chartKicker.textContent = "";
      dom.chartTitle.textContent = "";
      dom.chartCaption.textContent = "";
    }

    toggleVisibility(dom.timelinePanel, Boolean(timeline));
    if (timeline) {
      renderTimeline(timeline);
    } else {
      state.timelineRefs = [];
      dom.timelineKicker.textContent = "";
      dom.timelineTitle.textContent = "";
      dom.timelineCaption.textContent = "";
      dom.timelineTrack.innerHTML = "";
    }

    Array.from(dom.sceneList.children).forEach((button, index) => {
      button.classList.toggle("is-active", index === sceneIndex);
    });
  }

  function findSceneIndex(time) {
    const scenes = state.story.scenes;
    const target = clamp(time, 0, state.duration);
    for (let index = 0; index < scenes.length; index += 1) {
      if (target >= scenes[index].start && target < scenes[index].end) {
        return index;
      }
    }
    return scenes.length - 1;
  }

  function updateMap(scene, sceneProgress) {
    const activeGroups = new Set(scene.mapGroups || []);
    const activeCities = new Set(scene.focusCities || []);

    state.map.routes.forEach((route) => {
      const active = activeGroups.has(route.group);
      if (active) {
        activeCities.add(route.from);
        activeCities.add(route.to);
      }

      route.base.attr("opacity", active ? 0.42 : 0.08);
      route.flow.attr("opacity", active ? 0.94 : 0.1);
      route.flow.classed("is-muted", !active);

      const dashOffset = -((state.currentTime * (66 + route.weight * 18)) % route.length);
      route.flow.attr("stroke-dashoffset", dashOffset);

      const pulsePosition = (state.currentTime * (86 + route.index * 4)) % route.length;
      const point = route.path.getPointAtLength(pulsePosition);
      route.pulse
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("opacity", active ? 0.94 : 0.06)
        .attr("r", active ? 4 + Math.sin(state.currentTime * 2.2 + route.index) * 0.4 : 2.5);
    });

    state.map.cities.forEach((city, cityId) => {
      const active = activeCities.has(cityId);
      const pulse = 1 + ((Math.sin(state.currentTime * 2.8 + city.phase) + 1) / 2) * 0.46;
      const reveal = clamp(sceneProgress * 1.6, 0, 1);
      city.group.classed("is-muted", !active);
      city.halo
        .attr("r", active ? 8 + pulse * 4 : 6)
        .attr("opacity", active ? 0.22 + reveal * 0.42 : 0.12);
      city.core.attr("r", active ? 3.6 + reveal : 2.8);
    });
  }

  function updateAvatar(scene) {
    const dockVisible = scene.avatarMode !== "none";
    toggleVisibility(dom.avatarDock, dockVisible);

    dom.avatarWaveBars.forEach((bar, index) => {
      const value = 24 + ((Math.sin(state.currentTime * 7 + index * 0.9) + 1) / 2) * 52;
      bar.style.height = `${value}%`;
    });

    const spotlight = scene.avatarSpotlight
      && state.currentTime >= scene.avatarSpotlight.start
      && state.currentTime <= scene.avatarSpotlight.end;

    dom.avatarDock.style.opacity = spotlight ? "0.44" : "1";
    dom.avatarSpotlight.classList.toggle("is-visible", Boolean(spotlight));
  }

  function updateUi(scene) {
    dom.progressFill.style.width = `${(state.currentTime / state.duration) * 100}%`;
    dom.currentTimeLabel.textContent = formatTime(state.currentTime);
    dom.timelineInput.value = String(state.currentTime);
    dom.playbackState.textContent = state.isPlaying ? "播放中" : "暂停";
    dom.playPauseButton.textContent = state.isPlaying ? "暂停" : "播放";
    dom.cleanModeButton.textContent = document.body.classList.contains("clean-mode") ? "退出录制模式" : "干净录制模式";
    if (scene) {
      dom.sceneTimeLabel.textContent = `${formatTime(scene.start)} - ${formatTime(scene.end)}`;
    }
  }

  function renderCurrentFrame() {
    const nextSceneIndex = findSceneIndex(state.currentTime);
    const scene = state.story.scenes[nextSceneIndex];
    if (!state.activeScene || nextSceneIndex !== state.currentSceneIndex) {
      applyScene(nextSceneIndex);
    }

    const sceneDuration = Math.max(0.001, scene.end - scene.start);
    const sceneProgress = clamp((state.currentTime - scene.start) / sceneDuration, 0, 1);

    updateReveal(dom.metricRefs, sceneProgress, 0.08);
    updateReveal(dom.bulletRefs, sceneProgress + 0.04, 0.06);
    updateReveal(dom.cardRefs, sceneProgress + 0.08, 0.08);
    updateChartProgress(sceneProgress);
    updateTimelineProgress(sceneProgress);
    updateMap(scene, sceneProgress);
    updateAvatar(scene);
    updateUi(scene);
  }

  function seek(timeInSeconds) {
    state.currentTime = clamp(timeInSeconds, 0, state.duration);
    renderCurrentFrame();
  }

  function play() {
    if (state.isPlaying) {
      return;
    }
    document.body.classList.remove("static-frame");
    state.isPlaying = true;
    state.lastTimestamp = 0;
    updateUi(state.activeScene);
    requestAnimationFrame(tick);
  }

  function pause() {
    state.isPlaying = false;
    state.lastTimestamp = 0;
    updateUi(state.activeScene);
  }

  function tick(timestamp) {
    if (!state.isPlaying) {
      return;
    }

    if (!state.lastTimestamp) {
      state.lastTimestamp = timestamp;
    }

    const delta = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;
    state.currentTime += delta;

    if (state.currentTime >= state.duration) {
      state.currentTime = state.duration;
      pause();
    }

    renderCurrentFrame();

    if (state.isPlaying) {
      requestAnimationFrame(tick);
    }
  }

  function setCleanMode(enabled) {
    document.body.classList.toggle("clean-mode", enabled);
    updateUi(state.activeScene);
  }

  function buildSceneList() {
    dom.sceneList.innerHTML = "";
    state.story.scenes.forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-chip";
      button.innerHTML = `
        <strong>${scene.label}</strong>
        <span>${scene.summary}</span>
      `;
      button.addEventListener("click", () => {
        seek(scene.start);
        pause();
      });
      dom.sceneList.appendChild(button);
    });
  }

  function applyMeta() {
    dom.controlTitle.textContent = state.story.meta.title;
    dom.controlDescription.textContent = state.story.meta.description;
    dom.outputSpec.textContent = state.story.meta.outputSpec;
    dom.dataNotice.textContent = state.story.meta.dataNotice;
    dom.timelineInput.max = String(state.story.meta.duration);
    state.duration = state.story.meta.duration;
  }

  function parseInitialState() {
    const params = new URLSearchParams(window.location.search);
    const clean = params.get("clean") === "1";
    const autoplay = params.get("autoplay") === "1";
    const sceneId = params.get("scene");
    const time = params.has("t") ? Number(params.get("t")) : null;
    document.body.classList.toggle("static-frame", !autoplay && (params.has("t") || Boolean(sceneId)));

    setCleanMode(clean);

    if (sceneId) {
      const scene = state.story.scenes.find((item) => item.id === sceneId);
      if (scene) {
        state.currentTime = scene.start;
      }
    }

    if (typeof time === "number" && Number.isFinite(time)) {
      state.currentTime = clamp(time, 0, state.duration);
    }

    renderCurrentFrame();

    if (autoplay) {
      play();
    } else {
      pause();
    }
  }

  function bindEvents() {
    dom.playPauseButton.addEventListener("click", () => {
      if (state.isPlaying) {
        pause();
      } else {
        play();
      }
    });

    dom.restartButton.addEventListener("click", () => {
      seek(0);
      pause();
    });

    dom.cleanModeButton.addEventListener("click", () => {
      setCleanMode(!document.body.classList.contains("clean-mode"));
    });

    dom.timelineInput.addEventListener("input", () => {
      seek(Number(dom.timelineInput.value));
    });

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (state.isPlaying) {
          pause();
        } else {
          play();
        }
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        seek(state.currentTime + 2);
        pause();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        seek(state.currentTime - 2);
        pause();
        return;
      }

      if (event.code === "KeyC") {
        event.preventDefault();
        setCleanMode(!document.body.classList.contains("clean-mode"));
        return;
      }

      const sceneNumber = Number(event.key);
      if (Number.isInteger(sceneNumber) && sceneNumber >= 1 && sceneNumber <= state.story.scenes.length) {
        event.preventDefault();
        const targetScene = state.story.scenes[sceneNumber - 1];
        seek(targetScene.start);
        pause();
      }
    });
  }

  function exposeApi() {
    window.KnowledgeVideoTemplate = {
      play,
      pause,
      seek,
      setCleanMode,
      getState() {
        return {
          currentTime: state.currentTime,
          duration: state.duration,
          scene: state.activeScene
        };
      }
    };
  }

  async function boot() {
    try {
      cacheDom();
      const [story, datasets, atlas] = await Promise.all([
        fetchJson(`${ASSET_ROOT}/story.json`),
        fetchJson(`${ASSET_ROOT}/datasets.json`),
        fetchJson(`${ASSET_ROOT}/world-atlas-110m.json`)
      ]);

      state.story = story;
      state.datasets = datasets;
      state.atlas = atlas;

      buildMap();
      buildSceneList();
      applyMeta();
      bindEvents();
      exposeApi();
      parseInitialState();
    } catch (error) {
      console.error(error);
      document.body.innerHTML = `
        <main style="min-height:100vh;display:grid;place-items:center;padding:32px;background:#030712;color:#e5eefb;font-family:${JSON.stringify("Avenir Next")},\"PingFang SC\",\"Microsoft YaHei\",sans-serif;">
          <div style="max-width:720px;padding:28px;border-radius:20px;border:1px solid rgba(148,197,255,.12);background:rgba(8,15,27,.82);">
            <h1 style="margin:0 0 12px;font-size:28px;">模板加载失败</h1>
            <p style="margin:0;color:#9cb7d4;line-height:1.7;">${error.message}</p>
          </div>
        </main>
      `;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
