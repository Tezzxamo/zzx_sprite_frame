import { contextBridge, ipcRenderer } from 'electron'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '../types'

// 暴露给渲染进程的 API
const api = {
  // 平台信息
  platform: process.platform,

  // 将本地文件路径转换为可在 <video> / <img> 中使用的 file:// URL
  getVideoFileUrl: (filePath: string) => pathToFileURL(filePath).href,

  // 选择视频文件
  selectVideoFile: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_VIDEO_FILE),

  // 获取视频信息（拖拽用）
  getVideoInfo: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_VIDEO_INFO, filePath),

  // 选择输出目录
  selectOutputDir: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_OUTPUT_DIR),

  // 提取帧
  extractFrames: (videoInfo: any, cropParams: any, settings: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.EXTRACT_FRAMES, videoInfo, cropParams, settings),

  // 导出帧
  exportFrames: (framePaths: string[], settings: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_FRAMES, framePaths, settings),

  // 获取临时帧列表
  getTempFrames: () => ipcRenderer.invoke(IPC_CHANNELS.GET_TEMP_FRAMES),

  // 删除临时帧
  deleteTempFrame: (framePath: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_TEMP_FRAME, framePath),

  // 读取文件为 base64
  readFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, filePath),

  // 监听进度事件
  onExtractProgress: (callback: (progress: any) => void) => {
    const handler = (_: any, progress: any) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.EXTRACT_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EXTRACT_PROGRESS, handler);
  },

  onExportProgress: (callback: (progress: any) => void) => {
    const handler = (_: any, progress: any) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.EXPORT_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EXPORT_PROGRESS, handler);
  },

  // 监听外部文件打开（拖拽到应用图标）
  onOpenFile: (callback: (filePath: string) => void) => {
    const handler = (_: any, filePath: string) => callback(filePath);
    ipcRenderer.on('app:open-file', handler);
    return () => ipcRenderer.removeListener('app:open-file', handler);
  },

  // 移除所有监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
