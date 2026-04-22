import { create } from 'zustand';
import type { VideoInfo, CropParams, ExtractSettings, FrameInfo, ExportProgress } from '../../types';

type ViewMode = 'import' | 'crop' | 'frames';

interface AppStore {
  // 视图状态
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // 视频信息
  videoInfo: VideoInfo | null;
  setVideoInfo: (info: VideoInfo | null) => void;

  // 裁剪参数
  cropParams: CropParams;
  setCropParams: (params: Partial<CropParams>) => void;
  resetCropParams: (width: number, height: number) => void;

  // 提取设置
  extractSettings: ExtractSettings;
  setExtractSettings: (settings: Partial<ExtractSettings>) => void;

  // 帧列表
  frames: FrameInfo[];
  setFrames: (frames: FrameInfo[]) => void;
  toggleFrameSelection: (id: string) => void;
  deleteFrame: (id: string) => void;
  selectAllFrames: (selected: boolean) => void;
  getSelectedFrames: () => FrameInfo[];

  // 处理状态
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;

  // 进度
  progress: ExportProgress | null;
  setProgress: (progress: ExportProgress | null) => void;

  // 当前播放时间（用于裁剪预览）
  currentTime: number;
  setCurrentTime: (time: number) => void;

  // 是否正在播放
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}

const defaultExtractSettings: ExtractSettings = {
  targetFps: 12,
  outputFormat: 'png',
  quality: 90,
  scalePercent: 100,
  namingPattern: 'frame_{0001}',
  outputDir: '',
  startTime: 0,
  endTime: 0,
  chromaKey: {
    enabled: false,
    color: '#00FF00',
    similarity: 0.4,
    blend: 0.0,
  },
};

export const useAppStore = create<AppStore>((set, get) => ({
  viewMode: 'import',
  setViewMode: (mode) => set({ viewMode: mode }),

  videoInfo: null,
  setVideoInfo: (info) => {
    set({ videoInfo: info });
    if (info) {
      // 初始化裁剪参数为全屏，时间范围为完整视频
      set({
        cropParams: {
          x: 0,
          y: 0,
          width: info.width,
          height: info.height,
        },
        extractSettings: {
          ...get().extractSettings,
          startTime: 0,
          endTime: info.duration,
        },
        viewMode: 'crop',
      });
    } else {
      set({ viewMode: 'import' });
    }
  },

  cropParams: { x: 0, y: 0, width: 0, height: 0 },
  setCropParams: (params) => set((state) => ({
    cropParams: { ...state.cropParams, ...params }
  })),
  resetCropParams: (width, height) => set({
    cropParams: { x: 0, y: 0, width, height }
  }),

  extractSettings: { ...defaultExtractSettings },
  setExtractSettings: (settings) => set((state) => ({
    extractSettings: { ...state.extractSettings, ...settings }
  })),

  frames: [],
  setFrames: (frames) => set({ frames }),
  toggleFrameSelection: (id) => set((state) => ({
    frames: state.frames.map(f => f.id === id ? { ...f, selected: !f.selected } : f)
  })),
  deleteFrame: (id) => set((state) => ({
    frames: state.frames.filter(f => f.id !== id)
  })),
  selectAllFrames: (selected) => set((state) => ({
    frames: state.frames.map(f => ({ ...f, selected }))
  })),
  getSelectedFrames: () => get().frames.filter(f => f.selected),

  isProcessing: false,
  setIsProcessing: (value) => set({ isProcessing: value }),

  progress: null,
  setProgress: (progress) => set({ progress }),

  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),

  isPlaying: false,
  setIsPlaying: (value) => set({ isPlaying: value }),
}));
