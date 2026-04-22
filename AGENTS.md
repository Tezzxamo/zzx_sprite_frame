# ZZX SpriteFrame —— AI 编码助手指南

> 本文件面向 AI 编码助手（Agent）。如果你正在阅读此文件，说明你对本项目一无所知，请严格依据以下内容进行操作，不要做假设。

---

## 项目概述

**ZZX SpriteFrame** 是一款面向游戏开发者（尤其是独立开发者与 Godot/Unity 用户）的桌面端视频转序列帧工具。核心功能包括：

- 视频导入（点击选择 / 拖拽上传 / 拖拽到应用图标）
- 可视化画面裁剪（左侧原画 + 右侧裁剪预览，支持鼠标拖拽调整选区）
- 自定义 FPS 抽帧、输出格式（PNG/JPEG/WebP/BMP）、缩放比例、命名模板
- 帧列表管理（删除、全选/反选）
- 批量导出到指定目录

项目语言与注释以**中文**为主。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 28 + Node.js |
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | [electron-vite](https://electron-vite.org/)（基于 Vite 5） |
| 状态管理 | Zustand 4 |
| 样式方案 | Tailwind CSS 3 + PostCSS + Autoprefixer |
| 视频处理 | FFmpeg（通过 `fluent-ffmpeg` 调用，`ffmpeg-static` 提供二进制） |
| 打包发布 | electron-builder |

---

## 项目结构

```
project_root
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 应用入口：窗口创建、生命周期、IPC 注册
│   │   ├── videoHandler.ts   # 视频信息读取、文件选择对话框 IPC
│   │   ├── exportHandler.ts  # 帧提取、导出、临时文件管理 IPC
│   │   └── ffmpegManager.ts  # FFmpeg 路径初始化、临时目录工具、格式化函数
│   ├── preload/              # 预加载脚本
│   │   └── index.ts          # contextBridge 暴露 API 给渲染进程
│   ├── renderer/             # 渲染进程（React 应用）
│   │   ├── main.tsx          # React DOM 挂载入口
│   │   ├── App.tsx           # 根组件，三栏布局 + 视图路由（import/crop/frames）
│   │   ├── index.html        # HTML 模板（含 CSP）
│   │   ├── index.css         # Tailwind 指令 + 自定义组件样式（.btn .panel 等）
│   │   ├── electron.d.ts     # Window.electronAPI 类型声明
│   │   ├── components/       # React 组件
│   │   │   ├── VideoDropZone.tsx      # 导入页：拖拽/点击上传
│   │   │   ├── VideoInfo.tsx          # 左侧面板：视频元信息展示
│   │   │   ├── CropCanvas.tsx         # 中间左侧：视频画布 + 可拖拽裁剪框
│   │   │   ├── PreviewPanel.tsx       # 中间右侧：裁剪预览
│   │   │   ├── CropParamsPanel.tsx    # 右侧：裁剪参数 X/Y/W/H 微调
│   │   │   ├── ExtractSettings.tsx    # 左侧：FPS/格式/缩放/命名模板设置
│   │   │   ├── FrameList.tsx          # 帧列表：缩略图、选择、删除
│   │   │   └── ExportPanel.tsx        # 右侧：输出目录选择、导出按钮、进度
│   │   └── stores/
│   │       └── appStore.ts   # Zustand 全局状态（视图、视频、裁剪、帧、进度）
│   └── types/
│       └── index.ts          # 全项目共享 TS 类型与 IPC 通道常量
├── resources/                # 打包资源（图标等，electron-builder 引用）
├── out/                      # electron-vite 构建输出（main / preload / renderer）
├── dist/                     # electron-builder 最终安装包输出
├── package.json
├── electron.vite.config.ts   # electron-vite 构建设置
├── electron-builder.json     # 应用打包配置
├── tsconfig.json             # 渲染进程 TS 配置
├── tsconfig.node.json        # 主进程/配置脚本 TS 配置
├── tailwind.config.js        # Tailwind 内容路径 + 自定义色板
├── postcss.config.js         # PostCSS 插件
└── .gitignore
```

### 进程与 IPC 架构

- **主进程（Main）**：负责窗口管理、原生对话框、文件系统操作、FFmpeg 命令执行。
- **预加载（Preload）**：通过 `contextBridge` 将 `window.electronAPI` 暴露给渲染进程。
- **渲染进程（Renderer）**：React 单页应用，所有 UI 交互逻辑在此。

所有 IPC 通道名称统一定义在 `src/types/index.ts` 的 `IPC_CHANNELS` 常量对象中，禁止在代码中硬编码字符串。

---

## 构建与运行命令

```bash
# 开发模式（热更新）
npm run dev

# 类型检查（tsc --noEmit）
npm run typecheck

# 生产构建（含类型检查）
npm run build

# 预览生产构建
npm run preview

# 打包当前平台
npm run dist

# 仅打包 Windows（nsis）
npm run dist:win

# 安装原生依赖（postinstall 已自动执行）
npm run postinstall
```

> **注意**：`npm run build` 会先执行 `typecheck`，任何 TypeScript 错误都会阻止构建。`noUnusedLocals` 和 `noUnusedParameters` 已开启，未使用的变量/参数会报错。

---

## 代码风格与约定

### 语言与注释

- **UI 文本、注释、文档使用中文**。
- 代码标识符（变量名、函数名、类型名）使用英文，遵循 TS/React 常规命名。

### TypeScript 规范

- 严格模式开启（`"strict": true`）。
- 未使用的局部变量和参数会编译报错，必须清理。
- 渲染进程使用 `"jsx": "react-jsx"`（无需显式 `import React`）。
- 路径别名：
  - `@/*` → `src/*`
  - `@main/*` → `src/main/*`
  - `@preload/*` → `src/preload/*`
  - `@renderer/*` → `src/renderer/*`
  - 在 `electron.vite.config.ts` 中，渲染进程额外配置了 `@renderer` → `src/renderer`

### 组件风格

- 使用函数组件 + Hooks，默认导出组件。
- Zustand store 通过 selector 函数订阅状态，避免不必要重渲染：
  ```ts
  const videoInfo = useAppStore((s) => s.videoInfo);
  ```
- Tailwind 工具类为主；通用样式封装在 `index.css` 的 `@layer components` 中：
  - `.panel`、`.input-field`、`.btn-primary`、`.btn-secondary`、`.btn-danger`、`.btn-success`
  - `.scrollbar-thin`（自定义滚动条）

### 状态管理约定

- 全局状态位于 `src/renderer/stores/appStore.ts`。
- 视图模式（`viewMode`）有三种：`import`、`crop`、`frames`，由 `setVideoInfo` 等 action 自动切换。
- 裁剪参数在导入视频后自动初始化为全画面（`x:0, y:0, width:videoWidth, height:videoHeight`）。

---

## 测试策略

**当前状态：本项目暂未配置任何测试框架。**

如果你需要添加测试，建议：

- 渲染进程组件测试：Vitest + React Testing Library（与 Vite 生态一致）。
- 主进程逻辑测试：Vitest（Node 环境）或直接使用 Node 的 `node:test`。
- FFmpeg 相关操作属于外部命令调用，建议用集成测试或 mock `fluent-ffmpeg`。

---

## 部署与打包

- **electron-builder** 配置在 `electron-builder.json`：
  - Windows：`nsis`（非一键安装，允许更改安装目录）。
  - macOS：`dmg`。
  - Linux：`AppImage`。
- `ffmpeg-static` 的 `ffmpeg.exe` 通过 `asarUnpack` 从 ASAR 包中解压，确保生产环境能正确调用。
- 构建产物：
  - `out/` —— electron-vite 编译后的 JS/HTML/CSS。
  - `dist/` —— electron-builder 生成的安装包。
- 图标资源放在 `resources/` 目录下（`.gitignore` 已排除图标二进制文件，仅保留目录结构说明）。

---

## 安全注意事项

- `contextIsolation: true`，`nodeIntegration: false`：渲染进程无法直接访问 Node API。
- 所有主进程能力通过 `preload/index.ts` 的 `contextBridge.exposeInMainWorld('electronAPI', api)` 显式暴露。
- `sandbox: false` 是为了允许预加载脚本中的某些原生调用，但已通过上下文隔离限制范围。
- CSP 已设置在 `index.html` 中：限制 `default-src`、`script-src`、`img-src` 等。
- 文件路径通过 IPC 传递，渲染进程不直接操作文件系统；主进程负责所有 `fs` 和 `ffmpeg` 调用。
- 临时目录使用 `app.getPath('temp')` 下的子目录，并在提取前清理旧目录，避免磁盘膨胀。

---

## 常见问题与注意事项

1. **FFmpeg 路径**：`ffmpegManager.ts` 优先使用 `ffmpeg-static`，回退到系统 PATH。如果打包后找不到 FFmpeg，检查 `electron-builder.json` 的 `asarUnpack` 是否包含对应平台二进制。
2. **大视频处理**：当前实现将帧提取到临时目录，再逐帧复制/转换到输出目录。处理超大视频时需注意磁盘空间。
3. **取消操作**：`exportHandler.ts` 中通过全局 `isCancelled` 标志控制 FFmpeg 进程终止（`SIGTERM`），但逐帧保存阶段的取消仅通过 `break` 实现，不会回滚已保存文件。
4. **Windows 任务栏**：`app.setAppUserModelId` 已在 `whenReady` 中设置，与 `electron-builder.json` 的 `appId` 保持一致。
