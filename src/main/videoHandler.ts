import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ffmpeg } from './ffmpegManager';
import { IPC_CHANNELS, type VideoInfo } from '../types';

// 获取视频信息
async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('未找到视频流'));
        return;
      }

      const stats = fs.statSync(filePath);
      const duration = metadata.format.duration || 0;
      const parseFps = (rate: string | undefined): number => {
        if (!rate) return 30;
        const parts = rate.split('/');
        if (parts.length === 2) return parseInt(parts[0]) / parseInt(parts[1]);
        return parseFloat(rate) || 30;
      };
      const fps = parseFps(videoStream.r_frame_rate) || parseFps(videoStream.avg_frame_rate);

      const info: VideoInfo = {
        path: filePath,
        name: path.basename(filePath),
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        duration,
        fps: Math.round(fps * 100) / 100,
        bitrate: metadata.format.bit_rate ? Math.round(parseInt(String(metadata.format.bit_rate)) / 1000) + ' kbps' : 'Unknown',
        codec: videoStream.codec_name || 'Unknown',
        size: stats.size,
      };

      resolve(info);
    });
  });
}

// 注册视频相关 IPC 处理器
export function registerVideoHandlers(): void {
  // 选择视频文件
  ipcMain.handle(IPC_CHANNELS.SELECT_VIDEO_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const info = await getVideoInfo(filePath);
    return info;
  });

  // 拖拽导入时获取视频信息
  ipcMain.handle(IPC_CHANNELS.GET_VIDEO_INFO, async (_, filePath: string) => {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    const info = await getVideoInfo(filePath);
    return info;
  });
}
