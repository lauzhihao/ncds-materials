(function () {
  const scripts = [
    "https://unpkg.com/d3@7.9.0/dist/d3.min.js",
    "https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js",
    ".004-assets/capitals.js",
    ".004-assets/cities.js",
    ".004-assets/themes.js",
    ".004-assets/map.js"
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load script: " + src));
      document.head.appendChild(script);
    });
  }

  async function boot() {
    try {
      for (const src of scripts) {
        await loadScript(src);
      }

      await window.WorldMap.init();

      await loadScript(".004-assets/panel.js");

      document.getElementById("z-in").addEventListener("click", () => window.WorldMap.zoomIn());
      document.getElementById("z-out").addEventListener("click", () => window.WorldMap.zoomOut());
      document.getElementById("z-reset").addEventListener("click", () => window.WorldMap.resetView());
    } catch (error) {
      console.error(error);
      const panel = document.getElementById("panel");
      if (panel) {
        panel.innerHTML = '<div class="panel-header"><div class="panel-title">Load failed</div></div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
