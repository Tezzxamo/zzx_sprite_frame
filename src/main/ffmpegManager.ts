import { app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

// 查找 FFmpeg 可执行文件路径
function getFfmpegPath(): string | undefined {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch {
    // ffmpeg-static 未安装或路径无效
  }
  return undefined;
}

// 查找 FFprobe 可执行文件路径
function getFfprobePath(): string | undefined {
  try {
    // ffprobe-static 导出的是 { path: string } 对象，不是字符串
    const ffprobeStatic = require('ffprobe-static');
    const ffprobePath = ffprobeStatic?.path || ffprobeStatic;
    if (ffprobePath && typeof ffprobePath === 'string' && fs.existsSync(ffprobePath)) {
      return ffprobePath;
    }
  } catch {
    // ffprobe-static 未安装或路径无效
  }
  return undefined;
}

// 初始化 FFmpeg / FFprobe 路径
const ffmpegPath = getFfmpegPath();
const ffprobePath = getFfprobePath();

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

export { ffmpeg };

// 生成临时目录
export function getTempDir(): string {
  const tempDir = path.join(app.getPath('temp'), 'zzx-sprite-frame', Date.now().toString());
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

// 清理临时目录
export function cleanupTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时长
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
