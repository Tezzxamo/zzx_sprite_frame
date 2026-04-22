// 视频基本信息
export interface VideoInfo {
  path: string;
  name: string;
  width: number;
  height: number;
  duration: number; // 秒
  fps: number;
  bitrate: string;
  codec: string;
  size: number; // 字节
}

// 裁剪参数
export interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 绿幕配置
export interface ChromaKeyConfig {
  enabled: boolean;
  color: string;      // 十六进制颜色，如 '#00FF00'
  similarity: number; // 0.01 ~ 1.0
  blend: number;      // 0.0 ~ 1.0
}

// 提取设置
export interface ExtractSettings {
  targetFps: number;
  outputFormat: 'png' | 'jpg' | 'webp' | 'bmp';
  quality: number; // 1-100, 仅对 jpg/webp 有效
  scalePercent: number; // 10-200
  namingPattern: string; // 如 "frame_{0001}"
  outputDir: string;
  startTime: number; // 截取开始时间（秒）
  endTime: number;   // 截取结束时间（秒）
  chromaKey: ChromaKeyConfig;
}

// 帧信息
export interface FrameInfo {
  id: string;
  index: number;
  path: string;
  thumbnailPath: string;
  selected: boolean;
}

// 导出进度
export interface ExportProgress {
  current: number;
  total: number;
  phase: 'extracting' | 'saving' | 'done' | 'error';
  message: string;
}

// 应用状态
export interface AppState {
  videoInfo: VideoInfo | null;
  cropParams: CropParams;
  extractSettings: ExtractSettings;
  frames: FrameInfo[];
  isProcessing: boolean;
  progress: ExportProgress | null;
}

// IPC 通道定义
export const IPC_CHANNELS = {
  // 视频相关
  GET_VIDEO_INFO: 'video:get-info',
  VIDEO_INFO_RESULT: 'video:info-result',
  
  // 帧提取
  EXTRACT_FRAMES: 'frames:extract',
  EXTRACT_PROGRESS: 'frames:progress',
  EXTRACT_COMPLETE: 'frames:complete',
  
  // 导出
  EXPORT_FRAMES: 'frames:export',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETE: 'export:complete',
  
  // 对话框
  SELECT_OUTPUT_DIR: 'dialog:select-output-dir',
  SELECT_VIDEO_FILE: 'dialog:select-video-file',
  
  // 文件操作
  GET_TEMP_FRAMES: 'frames:get-temp',
  DELETE_TEMP_FRAME: 'frames:delete-temp',
  READ_FILE: 'file:read',
} as const;

export type IpcChannels = typeof IPC_CHANNELS;
