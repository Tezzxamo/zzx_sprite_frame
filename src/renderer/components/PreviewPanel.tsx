import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

// 十六进制颜色转 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 255, b: 0 };
}

// 将 RGB 转换到 YUV 空间，计算颜色相似度（比 RGB 欧氏距离更符合人眼感知）
function colorDistanceYUV(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
  const u1 = -0.147 * r1 - 0.289 * g1 + 0.436 * b1;
  const v1 = 0.615 * r1 - 0.515 * g1 - 0.100 * b1;

  const y2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
  const u2 = -0.147 * r2 - 0.289 * g2 + 0.436 * b2;
  const v2 = 0.615 * r2 - 0.515 * g2 - 0.100 * b2;

  // 降低 Y（亮度）通道权重，主要比较 UV（色度）
  const dy = (y1 - y2) * 0.5;
  const du = u1 - u2;
  const dv = v1 - v2;

  return Math.sqrt(dy * dy + du * du + dv * dv);
}

// 对 ImageData 应用 Chroma Key
function applyChromaKey(
  imageData: ImageData,
  keyColor: { r: number; g: number; b: number },
  similarity: number,
  blend: number
): ImageData {
  const data = imageData.data;
  const maxDist = 441.67; // sqrt(255^2 * 0.5^2 + 255^2 + 255^2) 的近似最大值
  const threshold = similarity * maxDist;
  const blendStart = threshold * (1 - blend);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = colorDistanceYUV(r, g, b, keyColor.r, keyColor.g, keyColor.b);

    if (dist < blendStart) {
      // 完全透明
      data[i + 3] = 0;
    } else if (dist < threshold) {
      // 混合边缘
      const alpha = ((dist - blendStart) / (threshold - blendStart)) * 255;
      data[i + 3] = Math.round(alpha);
    }
    // 否则保持原样
  }

  return imageData;
}

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoInfo = useAppStore((s) => s.videoInfo);
  const cropParams = useAppStore((s) => s.cropParams);
  const chromaKey = useAppStore((s) => s.extractSettings.chromaKey);

  // 获取视频当前帧并绘制到预览 canvas
  const drawPreview = useCallback(() => {
    if (!videoInfo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 创建离屏 canvas（尺寸与裁剪区域一致）
    let offscreen = offscreenCanvasRef.current;
    if (!offscreen || offscreen.width !== cropParams.width || offscreen.height !== cropParams.height) {
      offscreen = document.createElement('canvas');
      offscreen.width = cropParams.width;
      offscreen.height = cropParams.height;
      offscreenCanvasRef.current = offscreen;
    }

    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // 步骤 1: 从视频截取裁剪区域到离屏 canvas
    const video = document.getElementById('preview-video') as HTMLVideoElement | null;
    if (!video || video.readyState < 2) {
      // 视频未就绪，清空画布
      canvas.width = canvas.offsetWidth || 400;
      canvas.height = canvas.offsetHeight || 400;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // 将视频当前帧绘制到离屏 canvas（只绘制裁剪区域）
    offCtx.drawImage(
      video,
      cropParams.x, cropParams.y, cropParams.width, cropParams.height,
      0, 0, cropParams.width, cropParams.height
    );

    // 步骤 2: 获取像素数据
    let imageData = offCtx.getImageData(0, 0, cropParams.width, cropParams.height);

    // 步骤 3: 如果启用了绿幕，应用 chroma key
    if (chromaKey.enabled) {
      const keyColor = hexToRgb(chromaKey.color);
      imageData = applyChromaKey(imageData, keyColor, chromaKey.similarity, chromaKey.blend);
      offCtx.putImageData(imageData, 0, 0);
    }

    // 步骤 4: 将结果缩放到预览 canvas
    const containerW = canvas.offsetWidth || 400;
    const containerH = canvas.offsetHeight || 400;
    canvas.width = containerW;
    canvas.height = containerH;

    const scaleX = containerW / cropParams.width;
    const scaleY = containerH / cropParams.height;
    const scale = Math.min(scaleX, scaleY);

    const drawW = cropParams.width * scale;
    const drawH = cropParams.height * scale;
    const drawX = (containerW - drawW) / 2;
    const drawY = (containerH - drawH) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制棋盘格背景（表示透明区域）
    const tileSize = 10;
    for (let y = 0; y < canvas.height; y += tileSize) {
      for (let x = 0; x < canvas.width; x += tileSize) {
        const isDark = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2) === 0;
        ctx.fillStyle = isDark ? '#2a2a2a' : '#333333';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // 绘制裁剪后的帧（带 alpha）
    ctx.drawImage(offscreen, drawX, drawY, drawW, drawH);
  }, [videoInfo, cropParams, chromaKey]);

  // 监听变化时重绘
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // 使用 requestAnimationFrame 实现播放时实时预览
  useEffect(() => {
    if (!videoInfo) return;
    let rafId: number;

    const loop = () => {
      drawPreview();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [videoInfo, drawPreview]);

  if (!videoInfo) return null;

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
      {/* 网格参考线 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
      </div>
      {/* 绿幕状态指示 */}
      {chromaKey.enabled && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/80 text-white text-[10px] rounded">
          绿幕已启用
        </div>
      )}
    </div>
  );
}
