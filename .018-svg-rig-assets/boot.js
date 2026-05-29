/* boot.js — 字体注入 + 启动
 * 自定义字体走仓库根 /fonts/ 绝对路径（见 fonts/README.md）。Noto Sans/Serif SC
 * 由入口 HTML 的 Google Fonts <link> 提供，这里只注入仓库自带的展示字体。 */
(function () {
  const FONTS = [
    { family: 'ZQK Shuaihei', src: '/fonts/zqk-shuaihei/Regular.woff2' },
    { family: 'XY Kaiti', src: '/fonts/xy-kaiti/Regular.woff2' },
  ];

  function injectFontFaces(fonts) {
    const css = fonts.map((f) =>
      '@font-face{font-family:"' + f.family + '";src:url("' + f.src +
      '") format("woff2");font-weight:' + (f.weight || 'normal') +
      ';font-style:normal;font-display:swap;}'
    ).join('\n');
    const style = document.createElement('style');
    style.dataset.fontFaces = 'true';
    style.textContent = css;
    document.head.appendChild(style);
  }

  injectFontFaces(FONTS);

  function start() {
    if (window.App && typeof window.App.init === 'function') window.App.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
