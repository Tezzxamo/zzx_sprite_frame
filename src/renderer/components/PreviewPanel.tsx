import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoInfo = useAppStore((s) => s.videoInfo);
  const cropParams = useAppStore((s) => s.cropParams);
  const currentTime = useAppStore((s) => s.currentTime);

  // 绘制裁剪预览
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !videoInfo) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // 计算裁剪区域在画布中的显示尺寸
    const scaleX = canvas.width / cropParams.width;
    const scaleY = canvas.height / cropParams.height;
    const scale = Math.min(scaleX, scaleY);

    const drawW = cropParams.width * scale;
    const drawH = cropParams.height * scale;
    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;

    // 创建视频元素来抓取当前帧
    const video = document.createElement('video');
    video.src = `file://${videoInfo.path}`;
    video.muted = true;
    video.currentTime = currentTime;
    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        video,
        cropParams.x, cropParams.y, cropParams.width, cropParams.height,
        drawX, drawY, drawW, drawH
      );
    };

    // 如果视频已加载，直接绘制
    if (video.readyState >= 2) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        video,
        cropParams.x, cropParams.y, cropParams.width, cropParams.height,
        drawX, drawY, drawW, drawH
      );
    }
  }, [videoInfo, cropParams, currentTime]);

  // 监听时间变化和尺寸变化时重绘
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => drawPreview();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawPreview]);

  if (!videoInfo) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
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
    </div>
  );
}
