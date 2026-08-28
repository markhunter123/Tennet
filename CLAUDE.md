# CLAUDE.md — Tennet

## 项目简介

Tennet 是一个本地优先的 AI Agent 工作台（个人 AI 助手）：数据在本机，执行走 Runtime Host。由 Apache Maka（ASF 孵化项目）迁移改名而来，许可 Apache-2.0（ASF 许可证头与合规脚本保留），版本 1.0.0。

- **技术栈**：TypeScript monorepo（npm workspaces）+ Electron 43 桌面端 + Rust 原生组件
- **文档语言**：仓库文档为简体中文；代码注释与技术标识符保留英文（技术术语不强行翻译）

## 目录结构（扁平化 tennet-* 布局）

```
tennet-core/          Session、Event、Permission、Connection 纯契约
tennet-storage/       SQLite 运行状态、配置与 payload stores
tennet-mcp/           Model Context Protocol 客户端集成
tennet-runtime/       AgentRun、模型适配、工具、上下文和恢复
tennet-runtime-host/  Runtime Host 生命周期、协议和客户端启动
tennet-computer-use/  Computer Use 后端与协议适配
tennet-eval/          Experiment cell/attempt/result 与 subject adapter
tennet-cli/           TUI 和非交互 CLI（npm 包名：tennet-agent）
tennet-ui/            共享对话、Markdown、Artifact UI primitives
tennet-desktop/       Electron main/preload/React renderer
native/               Rust：runtime-host-peer、gitoxide-helper
docs/  scripts/  skills/  experiments/  patches/  .github/
```

## 常用命令

```bash
npm run build          # 全量构建 10 个 workspace
npm run typecheck      # 类型检查
npm run dev            # 带 HMR 的 Desktop 开发
npm run cli:dev        # 开发版 CLI（npm run cli:dev -- run "<任务>" 单次执行）
npm run test           # 测试（先 build:test）
npm run lint           # biome lint
```

- Node ≥ 22.19（本机 24.19）；npm 为包管理器（lockfile 与 scripts 以 npm 为准）
- `ripgrep` 为 Runtime `Grep` 工具的运行时依赖

## 关键规则（务必遵守）

### 1. 扁平化路径深度

本仓库由 `packages/*` + `apps/desktop` 扁平化为顶层 `tennet-*`，引用仓库根少一层 `..`：

- 包内相对引用（不逃出包目录）：**不变**
- 逃逸到仓库根的引用：**`..` 数量减 1**
- 同级包引用必须带前缀：`../core` → `../tennet-core`（tsconfig 的 `references` 特别注意）
- 易漏形式：拆分参数的 `'..', '..'` 和拆分目录名的 `join(x, 'packages', 'runtime')`——新写代码一律直接用 `tennet-*` 完整路径
- 测试夹具/路径穿越用例里的 `..` 值不是仓库路径，不要改
- vite 的 `outDir` 相对 vite root（`src/renderer`）解析，不是相对 vite.config.ts

### 2. Electron 启动陷阱

本机环境会注入进程级 `ELECTRON_RUN_AS_NODE=1`，导致 Electron 以纯 Node 运行（'electron' 模块解析失败、不弹窗）。任何启动 Electron 的命令前先执行：

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
```

### 3. Rust 组件构建（本机无 VS 构建工具）

`native/runtime-host-peer` 钉死 rustc 1.98.0（`rust-toolchain.toml`）。本机用 clang-cl + lld-link + Windows SDK 免 VS 构建：

```powershell
$shim='D:\project\llvm-shims'; $llvm='C:\Program Files\LLVM\bin'
$kits='C:\Program Files (x86)\Windows Kits\10'
$xwin='C:\Users\Monday\AppData\Local\cargo-xwin\xwin'
$env:PATH = "$shim;$llvm;$env:PATH"
$env:CC="$llvm\clang-cl.exe"; $env:CXX="$llvm\clang-cl.exe"
$env:INCLUDE="$kits\Include\10.0.18362.0\shared;$kits\Include\10.0.18362.0\um;$kits\Include\10.0.18362.0\ucrt;$xwin\crt\include"
$env:LIB="$kits\Lib\10.0.18362.0\um\x64;$kits\Lib\10.0.18362.0\ucrt\x64;$xwin\crt\lib\x86_64"
$env:CARGO_ENCODED_RUSTFLAGS="-Clinker=$llvm\lld-link.exe"
$env:TENNET_RUNTIME_HOST_PEER_CARGO_TARGET='x86_64-pc-windows-msvc'
node native/runtime-host-peer/build.mjs
```

- napi 组件必须用 **msvc 目标**（gnu 目标需要 libnode.dll，现代 Node 分发包已不提供）
- 修改 Cargo.toml 的 version 后需 `cargo update` 刷新 Cargo.lock（build.mjs 带 `--locked`）

### 4. npm 发布契约

- CLI 的 npm 包名是 **`tennet-agent`**（不是 @tennet/cli）；workspace 脚本里用 `npm --workspace tennet-agent`
- `tennet-cli/README.zh-CN.md` 是 `scripts/release-cli-package.mjs` 的硬性拷贝来源，**不可删除**
- package-lock.json 的 integrity 哈希不可文本替换；改名用定向替换后跑 `npm install` 重写锁文件

### 5. 图标资产可复现性

- 图标由 `scripts/generate-app-icons.py` 的几何常量渲染（Beacon T 标记），`--check` 字节级校验；改几何必须重跑生成器
- `mono.png`（透明黑标）由该脚本透明渲染；`icon.png` 与 hero 横幅由 `scripts/generate-brand-assets.mjs`（Playwright Chromium）合成
- 修改 Cargo/package 版本号或几何后，相关 CI 校验会对照重生成结果

### 6. 文档约定

- 中文文档中：代码块、命令、CLI 参数、环境变量、文件路径、包名、版本号、模型名保留原文；常用技术术语（runtime、workspace、sandbox、MCP、prompt 等）保留英文
- ASF 许可证头注释块（文件顶部的 HTML/JS 注释）保持英文原样，任何文档翻译不得触碰

## 桌面快捷方式（本机）

- 桌面 `Tennet.lnk` → `D:\project\tennet-launcher\Tennet.vbs`：无控制台窗口启动**已构建**的应用（`npm --workspace @tennet/desktop run start`），图标为 Beacon T（Tennet.ico）
- 快捷方式启动的是 `dist-renderer` 预构建产物，**改代码后需先 `npm run build`（或至少 `npm --workspace @tennet/desktop run build:renderer`）**，快捷方式才会反映新代码
- 启动日志：`%TEMP%\tennet-launch.log`；启动失败且无窗口时先查它
- 单实例锁：dev 实例（`npm run dev`）在跑时，快捷方式启动会被吸收退出；反之亦然

## 其他注意

- GitHub URL 使用占位组织 `tennet-ai/tennet`（原 apache/maka），上线前替换为真实仓库
- `patches/@astryxdesign+core+0.5.0.patch` 若被修改，patch-package 会解析失败（npm install 报错先查它）
- 版本号统一在根和各 workspace 的 package.json / Cargo.toml；内部依赖版本规范同步对齐
- `.tennet-shots/` 为历史 UI 截图文档资产
