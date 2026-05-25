这是一个 html 的素材仓库，允许使用任何技术栈来实现。

在设计素材时必须确保 html/js/css/json 是一整套。

## 命名规范

- 入口文件：`001-world-map.html`（数字前缀 + 短横线 + 描述，放仓库根目录）
- 资源目录：`.001-world-map-assets/`（**前面带一个英文点**），所有 js / css / json / svg / image 等依赖都放进去
- HTML 引用资源时使用 dot 前缀路径，例如 `<link href=".001-world-map-assets/styles.css">`、`<script src=".001-world-map-assets/app.js">`
- 脚本内部的相对路径 / `ASSET_ROOT` 常量也要带 dot 前缀，例如 `const ASSET_ROOT = ".001-world-map-assets";`

## 为什么用 dot 前缀

ncds.cc 用 nginx autoindex 把仓库根目录直接当列表页展示，方便切换素材。nginx autoindex 默认跳过以 `.` 开头的条目，所以 `.001-world-map-assets/` 这种目录**不会出现在 / 列表里**，但常规 HTTP 请求仍然能拿到目录下的文件（200）。这样既保持根目录列表清爽，HTML 又能正常加载依赖。

> ncds.cc 的 nginx vhost 里 `location ~ /\.(?!well-known/|\d) { deny all; }` 这条只放行 `.数字开头` 的 dot 路径，对 `.git` / `.env` / `.ssh` 等仍然 403。如果 vhost 配置被重建，必须保留这条放行规则，否则所有素材资源会被拦截。

## 从上一套复制开新一套

新项目命名 `<NNN>-<theme>`（例：`012-not-fooled`）。从上一套 `<PREV>-<old>` 复制后，下面这些都要改一遍——大多是 slug 字符串替换，少漏一处线上就会 404。

### 1. 文件 / 目录改名（用 `git mv` 保留 history）

- `<PREV>-<old>.html` → `<NNN>-<theme>.html`
- `.<PREV>-<old>-assets/` → `.<NNN>-<theme>-assets/`
- 资源目录里的 manifest：`<PREV>-<old>.json` → `<NNN>-<theme>.json`

### 2. 文件内 slug 字符串替换

逐文件把 `<PREV>-<old>` 改成 `<NNN>-<theme>`：

- **入口 HTML**：约 2 处（`styles.css` 链接 + `bootstrap.js` 的 src 路径）
- **资源目录里的 manifest JSON**：约 7 处（`id` / `entry` / `style` / `script` / `assets` / `scripts[]`）
- **`render.mjs`**：约 5 处（`OUTPUT_MP4` / 各 `TMP_*` / `URL_LOCAL` / 注释里写的命令）
- **`episode.json` 的 `meta.slug`**：⚠️ **必须** 等于资源目录的 slug——bootstrap.js 用 URL 推出的 slug 为准，但 `meta.slug` 不一致时会在浏览器控制台 `console.warn`，看不到 warn 就说明对齐了

### 3. 业务内容重写

- `episode.json`：`meta.title` / `brandTitle` / `titleOptions` / `disclaimer` / `beats[]` / `scenes{}` 按新主题重写
- `pictures/`：旧文件叫 `NN-<old-scene>.webp`，新 scene id 完全不匹配——**要么删掉重跑 `pic_gen.py`**，要么按新 scene 顺序批量重命名作为预览占位
- `audio/`：按 beat index 命名（`0001.mp3`...），beat 数或文案变了就 `tts_gen.py` 重生成

## 提交与部署

完成后提交并推送代码，然后执行远程部署 `ssh root@ncds.cc 'deploy-ncds-cc'` 进行验证。

线上静态资源走 `cache-control: immutable, max-age=2592000`（30 天缓存）。改完打开页面一定**硬刷**（`Cmd+Shift+R` / `Ctrl+Shift+F5`），或在 URL 末尾加个新 query（如 `?nuke=1`）强制重拉，否则浏览器拿的还是旧的 HTML / episode.json，看不到改动。
