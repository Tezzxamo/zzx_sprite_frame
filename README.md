# ZZX SpriteFrame

> 🎬 视频转序列帧工具 —— 专为游戏角色动画设计

[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-powered-007808?logo=ffmpeg)](https://ffmpeg.org/)

---

## 📖 项目简介

**ZZX SpriteFrame** 是一款面向游戏开发者（尤其是独立开发者与 Godot / Unity 用户）的桌面端视频转序列帧工具。

将视频素材一键转换为精灵动画帧，支持可视化裁剪、自定义抽帧率、批量导出，让你的角色动画制作流程更加高效。

![界面预览](docs/screenshot.png)

---

## ✨ 功能特性

### 🎥 视频导入
- 拖拽视频文件到窗口直接导入
- 点击按钮选择视频文件
- 支持 MP4、MOV、AVI、WEBM、MKV、FLV、WMV 等主流格式
- 自动读取视频元信息（分辨率、时长、帧率、编码、码率、文件大小）

### ✂️ 可视化裁剪
- **双栏实时预览**：左侧原始画面 + 右侧裁剪预览
- **鼠标交互裁剪**：拖拽移动裁剪框、拖拽边角调整大小
- **参数精确微调**：X / Y / 宽度 / 高度 输入框，支持键盘方向键 ±1px 微调
- **一键恢复全屏**：快速重置裁剪区域为完整画面
- **九宫格参考线**：辅助对齐角色锚点

### ⚙️ 帧提取设置
- 自定义每秒提取帧数（1 ~ 60 FPS）
- 实时计算并显示预计总帧数
- 输出格式支持：PNG / JPEG / WebP / BMP
- 输出缩放比例（10% ~ 200%）
- 自定义命名模板（如 `frame_{0001}`）

### 🖼️ 帧管理与导出
- 提取后帧网格缩略图展示
- 支持单帧选择 / 全选 / 反选
- 支持删除不需要的帧
- 批量导出到指定目录
- 实时导出进度条

### 🎮 为 Godot 优化（后续扩展）
- [ ] 精灵表（Sprite Sheet）合并导出
- [ ] 直接生成 Godot `.tres` 资源文件
- [ ] 绿幕 / 蓝幕抠图
- [ ] 智能去重（基于帧相似度）
- [ ] 项目配置保存与重新加载

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) v18 或更高版本
- Windows 10 / 11、macOS 或 Linux

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/Tezzxamo/zzx_sprite_frame.git
cd zzx_sprite_frame

# 2. 启动（自动安装依赖 + 交互式菜单）
npm start
```

### 手动命令

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 打包 Windows 安装程序
npm run dist:win
```

---

## 📸 使用流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. 导入视频 │ → │  2. 裁剪画面 │ → │  3. 提取帧   │ → │  4. 导出帧   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     拖拽/选择          拖拽选区           设置 FPS            选择目录
                       参数微调           点击提取            批量保存
```

### 详细步骤

1. **导入视频**：将视频文件拖入应用窗口，或点击"选择视频文件"按钮
2. **调整裁剪**：在左侧画布上拖拽蓝色裁剪框，或在右侧面板输入精确参数
3. **设置参数**：在左侧面板调整目标帧率、输出格式、缩放比例、命名模板
4. **提取帧**：点击"提取帧"按钮，等待进度完成
5. **管理帧**：在帧列表中删除不需要的帧，或调整选择状态
6. **导出**：选择输出目录，点击"导出帧"完成保存

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        渲染进程 (Renderer)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 视频导入模块 │  │ 裁剪预览模块 │  │ 帧提取与导出模块     │  │
│  │ - 拖拽上传   │  │ - 双栏画布   │  │ - FPS/格式/缩放设置 │  │
│  │ - 视频信息   │  │ - 参数微调   │  │ - 帧列表管理        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│              React 18 + TypeScript + Tailwind CSS + Zustand  │
├─────────────────────────────────────────────────────────────┤
│                      主进程 (Main)                            │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐│
│  │ 文件系统操作     │  │ FFmpeg 视频处理服务                  ││
│  │ - 读写帧文件    │  │ - 视频解码/裁剪/抽帧/格式转换        ││
│  │ - 项目文件存取  │  │ - 临时目录管理                       ││
│  └─────────────────┘  └─────────────────────────────────────┘│
│              Electron + Node.js + fluent-ffmpeg              │
└─────────────────────────────────────────────────────────────┘
```

### 核心技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | [Electron](https://www.electronjs.org/) 28 | 跨平台桌面应用 |
| 构建工具 | [electron-vite](https://electron-vite.org/) | 基于 Vite 5，支持热更新 |
| 前端框架 | [React](https://react.dev/) 18 | UI 组件与状态管理 |
| 语言 | [TypeScript](https://www.typescriptlang.org/) 5 | 类型安全 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) 3 | 原子化 CSS |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) 4 | 轻量全局状态 |
| 视频处理 | [FFmpeg](https://ffmpeg.org/) | 通过 fluent-ffmpeg 调用 |
| 打包 | [electron-builder](https://www.electron.build/) | 生成安装程序 |

---

## 📁 项目结构

```
zzx_sprite_frame/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 应用入口
│   │   ├── videoHandler.ts      # 视频信息读取 IPC
│   │   ├── exportHandler.ts     # 帧提取/导出 IPC
│   │   └── ffmpegManager.ts     # FFmpeg 路径与临时目录
│   ├── preload/                 # 预加载脚本
│   │   └── index.ts             # contextBridge 暴露安全 API
│   ├── renderer/                # React 渲染进程
│   │   ├── main.tsx             # React 挂载入口
│   │   ├── App.tsx              # 根组件（三栏布局）
│   │   ├── index.html           # HTML 模板
│   │   ├── index.css            # Tailwind + 自定义组件样式
│   │   ├── components/          # UI 组件
│   │   │   ├── VideoDropZone.tsx
│   │   │   ├── VideoInfo.tsx
│   │   │   ├── CropCanvas.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── CropParamsPanel.tsx
│   │   │   ├── ExtractSettings.tsx
│   │   │   ├── FrameList.tsx
│   │   │   └── ExportPanel.tsx
│   │   └── stores/
│   │       └── appStore.ts      # Zustand 全局状态
│   └── types/
│       └── index.ts             # TS 类型与 IPC 通道常量
├── start.js                     # 启动脚本（交互式菜单）
├── package.json
├── electron.vite.config.ts      # 构建设置
├── electron-builder.json        # 打包配置
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## 🔧 开发指南

### 启动脚本菜单

```bash
npm start
```

```
============================================
    ZZX SpriteFrame - 视频转序列帧工具
============================================

  [1] 开发模式启动    npm run dev
  [2] 类型检查        npm run typecheck
  [3] 生产构建        npm run build
  [4] 打包安装包(Win) npm run dist:win
  [5] 安装/更新依赖   npm install
  [0] 退出
```

### 代码规范

- UI 文本、注释使用**中文**
- 代码标识符使用英文，遵循 TS/React 命名规范
- 所有 IPC 通道名称统一定义在 `src/types/index.ts`，禁止硬编码字符串
- Zustand store 通过 selector 函数订阅状态，避免不必要重渲染

### TypeScript 配置

- `strict: true` — 严格模式
- `noUnusedLocals: true` — 未使用变量报错
- `noUnusedParameters: true` — 未使用参数报错

---

## 📦 打包发布

### Windows

```bash
npm run dist:win
```

输出：`dist/ZZX SpriteFrame Setup x.x.x.exe`

### 其他平台

```bash
npm run dist
```

---

## 🗺️ 路线图

### Phase 1 ✅ 已完成
- [x] 视频导入（拖拽 + 文件选择）
- [x] 可视化裁剪（鼠标拖拽 + 参数微调）
- [x] 双栏实时预览
- [x] 自定义 FPS 抽帧
- [x] 帧列表管理（选择、删除）
- [x] 批量导出（PNG/JPG/WEBP/BMP）

### Phase 2 🚧 计划中
- [ ] 精灵表（Sprite Sheet）合并导出
- [ ] 输出缩放与命名模板增强
- [ ] 项目配置保存与重新加载
- [ ] 快捷键支持

### Phase 3 📋 待规划
- [ ] 绿幕 / 蓝幕 / 自定义颜色抠图
- [ ] 智能去重（基于帧相似度）
- [ ] 直接生成 Godot `.tres` 资源文件
- [ ] 批量处理多个视频

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m "feat: add xxx"`
4. 推送分支：`git push origin feature/xxx`
5. 提交 Pull Request

---

## 📄 许可证

[MIT](LICENSE)

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [FFmpeg](https://ffmpeg.org/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
