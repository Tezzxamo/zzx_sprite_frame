import { useRef, useEffect, useCallback, useState } from 'react';
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

// 将 RGB 转换到 YUV 空间计算颜色距离
function colorDistanceYUV(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
  const u1 = -0.147 * r1 - 0.289 * g1 + 0.436 * b1;
  const v1 = 0.615 * r1 - 0.515 * g1 - 0.100 * b1;
  const y2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
  const u2 = -0.147 * r2 - 0.289 * g2 + 0.436 * b2;
  const v2 = 0.615 * r2 - 0.515 * g2 - 0.100 * b2;
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
  const maxDist = 441.67;
  const threshold = similarity * maxDist;
  const blendStart = threshold * (1 - blend);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = colorDistanceYUV(r, g, b, keyColor.r, keyColor.g, keyColor.b);

    if (dist < blendStart) {
      data[i + 3] = 0;
    } else if (dist < threshold) {
      const alpha = ((dist - blendStart) / (threshold - blendStart)) * 255;
      data[i + 3] = Math.round(alpha);
    }
  }
  return imageData;
}

// 绘制棋盘格背景
function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number, tileSize: number) {
  for (let y = 0; y < h; y += tileSize) {
    for (let x = 0; x < w; x += tileSize) {
      const isDark = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2) === 0;
      ctx.fillStyle = isDark ? '#2a2a2a' : '#333333';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

export default function PreviewPanel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const videoInfo = useAppStore((s) => s.videoInfo);
  const cropParams = useAppStore((s) => s.cropParams);
  const chromaKey = useAppStore((s) => s.extractSettings.chromaKey);

  // ResizeObserver 精确监听容器尺寸
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.round(width), height: Math.round(height) });
      }
    });

    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // 绘制预览
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !videoInfo) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerW = containerSize.width || wrapper.clientWidth || 400;
    const containerH = containerSize.height || wrapper.clientHeight || 400;

    if (containerW === 0 || containerH === 0) return;

    // 同步 canvas 像素尺寸与 CSS 尺寸（1:1，防止拉伸）
    if (canvas.width !== containerW || canvas.height !== containerH) {
      canvas.width = containerW;
      canvas.height = containerH;
    }

    // 创建/复用离屏 canvas（尺寸与裁剪区域一致）
    let offscreen = offscreenCanvasRef.current;
    if (!offscreen || offscreen.width !== cropParams.width || offscreen.height !== cropParams.height) {
      offscreen = document.createElement('canvas');
      offscreen.width = cropParams.width;
      offscreen.height = cropParams.height;
      offscreenCanvasRef.current = offscreen;
    }
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // 获取视频帧
    const video = document.getElementById('preview-video') as HTMLVideoElement | null;
    if (!video || video.readyState < 2) {
      ctx.clearRect(0, 0, containerW, containerH);
      return;
    }

    // 1. 将视频裁剪区域绘制到离屏 canvas
    offCtx.clearRect(0, 0, cropParams.width, cropParams.height);
    offCtx.drawImage(
      video,
      cropParams.x, cropParams.y, cropParams.width, cropParams.height,
      0, 0, cropParams.width, cropParams.height
    );

    // 2. 读取像素
    let imageData = offCtx.getImageData(0, 0, cropParams.width, cropParams.height);

    // 3. 应用绿幕
    if (chromaKey.enabled) {
      const keyColor = hexToRgb(chromaKey.color);
      imageData = applyChromaKey(imageData, keyColor, chromaKey.similarity, chromaKey.blend);
      offCtx.putImageData(imageData, 0, 0);
    }

    // 4. 计算缩放（contain 模式，填满容器）
    const scaleX = containerW / cropParams.width;
    const scaleY = containerH / cropParams.height;
    const scale = Math.min(scaleX, scaleY);

    const drawW = cropParams.width * scale;
    const drawH = cropParams.height * scale;
    const drawX = (containerW - drawW) / 2;
    const drawY = (containerH - drawH) / 2;

    // 5. 绘制到预览 canvas
    ctx.clearRect(0, 0, containerW, containerH);

    // 棋盘格背景（只在绿幕模式下显示，否则用黑色）
    if (chromaKey.enabled) {
      drawCheckerboard(ctx, containerW, containerH, 12);
    } else {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, containerW, containerH);
    }

    ctx.drawImage(offscreen, drawX, drawY, drawW, drawH);

    // 绘制尺寸标注
    ctx.fillStyle = '#60a5fa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(drawW)} × ${Math.round(drawH)}`, containerW / 2, containerH - 6);
  }, [videoInfo, cropParams, chromaKey, containerSize]);

  // 视频播放时实时刷新
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
    <div ref={wrapperRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
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
