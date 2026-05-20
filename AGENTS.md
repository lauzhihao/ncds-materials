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

## 提交与部署

完成后提交并推送代码，然后执行远程部署 `ssh root@ncds.cc 'deploy-ncds-cc'` 进行验证。
