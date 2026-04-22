import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ffmpeg, getTempDir, cleanupTempDir } from './ffmpegManager';
import { IPC_CHANNELS, type VideoInfo, type CropParams, type ExtractSettings, type ExportProgress } from '../types';

let currentTempDir: string | null = null;
let isCancelled = false;

// 获取当前临时目录
export function getCurrentTempDir(): string | null {
  return currentTempDir;
}

// 取消操作
export function cancelOperation(): void {
  isCancelled = true;
}

// 将十六进制颜色转换为 0xRRGGBB 格式（供 FFmpeg colorkey 使用）
function hexToColorkey(hex: string): string {
  const clean = hex.replace('#', '');
  return `0x${clean}`;
}

// 提取帧到临时目录
async function extractFramesToTemp(
  videoInfo: VideoInfo,
  cropParams: CropParams,
  settings: ExtractSettings,
  onProgress: (progress: ExportProgress) => void
): Promise<string[]> {
  isCancelled = false;

  // 清理旧临时目录
  if (currentTempDir) {
    cleanupTempDir(currentTempDir);
  }

  currentTempDir = getTempDir();
  const outputPattern = path.join(currentTempDir, 'frame_%04d.png');

  // 计算截取后的时长和总帧数
  const clipDuration = settings.endTime - settings.startTime;
  const totalFrames = Math.floor(clipDuration * settings.targetFps);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoInfo.path)
      .seekInput(settings.startTime)
      .duration(clipDuration)
      .fps(settings.targetFps)
      .output(outputPattern);

    // 构建滤镜链
    const filters: string[] = [];

    // 裁剪
    if (cropParams.width > 0 && cropParams.height > 0) {
      filters.push(`crop=${cropParams.width}:${cropParams.height}:${cropParams.x}:${cropParams.y}`);
    }

    // 缩放
    if (settings.scalePercent !== 100 && cropParams.width > 0 && cropParams.height > 0) {
      const newWidth = Math.round(cropParams.width * settings.scalePercent / 100);
      const newHeight = Math.round(cropParams.height * settings.scalePercent / 100);
      filters.push(`scale=${newWidth}:${newHeight}`);
    }

    // 绿幕抠图
    if (settings.chromaKey.enabled) {
      const color = hexToColorkey(settings.chromaKey.color);
      const sim = settings.chromaKey.similarity.toFixed(3);
      const blend = settings.chromaKey.blend.toFixed(3);
      filters.push(`colorkey=${color}:${sim}:${blend}`);
    }

    if (filters.length > 0) {
      command = command.videoFilters(filters);
    }

    // 输出格式：带 alpha 通道
    command = command.outputOptions(['-pix_fmt rgba']);

    command
      .on('start', () => {
        onProgress({
          current: 0,
          total: totalFrames,
          phase: 'extracting',
          message: '正在提取帧...'
        });
      })
      .on('progress', (progress) => {
        if (isCancelled) {
          command.kill('SIGTERM');
          return;
        }
        const current = Math.floor((progress.percent || 0) / 100 * totalFrames);
        onProgress({
          current: Math.min(current, totalFrames),
          total: totalFrames,
          phase: 'extracting',
          message: `正在提取帧... ${Math.round(progress.percent || 0)}%`
        });
      })
      .on('end', () => {
        // 读取生成的帧文件
        const files = fs.readdirSync(currentTempDir!)
          .filter(f => f.endsWith('.png'))
          .sort()
          .map(f => path.join(currentTempDir!, f));

        onProgress({
          current: totalFrames,
          total: totalFrames,
          phase: 'extracting',
          message: '帧提取完成'
        });

        resolve(files);
      })
      .on('error', (err) => {
        cleanupTempDir(currentTempDir!);
        currentTempDir = null;
        reject(err);
      })
      .run();
  });
}

// 导出帧到指定目录（支持格式转换）
async function exportFrames(
  framePaths: string[],
  settings: ExtractSettings,
  onProgress: (progress: ExportProgress) => void
): Promise<void> {
  const total = framePaths.length;
  
  onProgress({
    current: 0,
    total,
    phase: 'saving',
    message: '正在保存帧...'
  });
  
  for (let i = 0; i < framePaths.length; i++) {
    if (isCancelled) break;
    
    const srcPath = framePaths[i];
    const ext = settings.outputFormat === 'jpg' ? 'jpg' : settings.outputFormat;
    const fileName = settings.namingPattern
      .replace(/\{(0+)\}/, (_match, zeros) => {
        const num = (i + 1).toString();
        return num.padStart(zeros.length, '0');
      }) + `.${ext}`;
    const destPath = path.join(settings.outputDir, fileName);
    
    // 如果需要格式转换或质量调整
    if (settings.outputFormat === 'jpg' || settings.outputFormat === 'webp' || settings.outputFormat === 'bmp') {
      await new Promise((resolve, reject) => {
        let cmd = ffmpeg(srcPath);
        
        if (settings.outputFormat === 'jpg') {
          cmd = cmd.outputOptions([`-q:v ${Math.round((100 - settings.quality) / 10)}`]);
        } else if (settings.outputFormat === 'webp') {
          cmd = cmd.outputOptions([`-q:v ${settings.quality}`]);
        }
        
        cmd.output(destPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    } else {
      // PNG 直接复制
      fs.copyFileSync(srcPath, destPath);
    }
    
    onProgress({
      current: i + 1,
      total,
      phase: 'saving',
      message: `正在保存帧... ${i + 1}/${total}`
    });
  }
  
  onProgress({
    current: total,
    total,
    phase: 'done',
    message: '导出完成！'
  });
}

// 注册导出相关 IPC 处理器
export function registerExportHandlers(): void {
  // 选择输出目录
  ipcMain.handle(IPC_CHANNELS.SELECT_OUTPUT_DIR, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });
  
  // 提取帧
  ipcMain.handle(IPC_CHANNELS.EXTRACT_FRAMES, async (event, videoInfo: VideoInfo, cropParams: CropParams, settings: ExtractSettings) => {
    try {
      const framePaths = await extractFramesToTemp(videoInfo, cropParams, settings, (progress) => {
        event.sender.send(IPC_CHANNELS.EXTRACT_PROGRESS, progress);
      });
      
      return { success: true, framePaths, tempDir: currentTempDir };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // 导出帧
  ipcMain.handle(IPC_CHANNELS.EXPORT_FRAMES, async (event, framePaths: string[], settings: ExtractSettings) => {
    try {
      await exportFrames(framePaths, settings, (progress) => {
        event.sender.send(IPC_CHANNELS.EXPORT_PROGRESS, progress);
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // 获取临时帧列表
  ipcMain.handle(IPC_CHANNELS.GET_TEMP_FRAMES, async () => {
    if (!currentTempDir || !fs.existsSync(currentTempDir)) {
      return [];
    }
    
    const files = fs.readdirSync(currentTempDir)
      .filter(f => f.endsWith('.png'))
      .sort()
      .map((f, i) => ({
        id: `frame-${i}`,
        index: i,
        path: path.join(currentTempDir!, f),
        thumbnailPath: path.join(currentTempDir!, f),
        selected: true
      }));
    
    return files;
  });
  
  // 删除临时帧
  ipcMain.handle(IPC_CHANNELS.DELETE_TEMP_FRAME, async (_, framePath: string) => {
    if (fs.existsSync(framePath)) {
      fs.unlinkSync(framePath);
    }
    return true;
  });
  
  // 读取文件为 base64（用于渲染进程显示）
  ipcMain.handle(IPC_CHANNELS.READ_FILE, async (_, filePath: string) => {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  });
}
