import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';

// 拖拽模式
type DragMode = 'none' | 'move' | 'resize-nw' | 'resize-n' | 'resize-ne' | 'resize-e' | 'resize-se' | 'resize-s' | 'resize-sw' | 'resize-w';

const HANDLE_SIZE = 8;
const MIN_CROP_SIZE = 10;

export default function CropCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const videoInfo = useAppStore((s) => s.videoInfo);
  const cropParams = useAppStore((s) => s.cropParams);
  const setCropParams = useAppStore((s) => s.setCropParams);
  const currentTime = useAppStore((s) => s.currentTime);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  // 计算缩放比例（将视频坐标映射到容器坐标）
  const getScale = useCallback(() => {
    if (!videoInfo || containerSize.width === 0) return { sx: 1, sy: 1 };
    const sx = containerSize.width / videoInfo.width;
    const sy = containerSize.height / videoInfo.height;
    const s = Math.min(sx, sy);
    return { sx: s, sy: s };
  }, [videoInfo, containerSize]);

  // 获取视频在容器中的实际显示区域
  const getVideoDisplayRect = useCallback(() => {
    if (!videoInfo || containerSize.width === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const { sx } = getScale();
    const w = videoInfo.width * sx;
    const h = videoInfo.height * sx;
    const x = (containerSize.width - w) / 2;
    const y = (containerSize.height - h) / 2;
    return { x, y, w, h };
  }, [videoInfo, containerSize, getScale]);

  // 视频坐标 → 容器坐标
  const videoToContainer = useCallback((vx: number, vy: number) => {
    const rect = getVideoDisplayRect();
    const { sx } = getScale();
    return {
      x: rect.x + vx * sx,
      y: rect.y + vy * sx,
    };
  }, [getVideoDisplayRect, getScale]);

  // 容器坐标 → 视频坐标（预留，用于后续扩展）
  // const containerToVideo = useCallback((cx: number, cy: number) => {
  //   const rect = getVideoDisplayRect();
  //   const { sx } = getScale();
  //   return {
  //     x: (cx - rect.x) / sx,
  //     y: (cy - rect.y) / sx,
  //   };
  // }, [getVideoDisplayRect, getScale]);

  // 更新容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 绘制视频到 canvas（可选，用于更精确的帧控制）
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoInfo) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2) {
        const rect = getVideoDisplayRect();
        canvas.width = containerSize.width;
        canvas.height = containerSize.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, rect.x, rect.y, rect.w, rect.h);
      }
      requestAnimationFrame(draw);
    };

    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoInfo, containerSize, getVideoDisplayRect]);

  // 判断鼠标位置对应的拖拽模式
  const getDragModeAt = useCallback((cx: number, cy: number): DragMode => {
    const tl = videoToContainer(cropParams.x, cropParams.y);
    const br = videoToContainer(cropParams.x + cropParams.width, cropParams.y + cropParams.height);
    const hs = HANDLE_SIZE;

    // 检查各边角的 handle
    const near = (ax: number, ay: number, bx: number, by: number, threshold: number) =>
      Math.abs(ax - bx) < threshold && Math.abs(ay - by) < threshold;

    if (near(cx, cy, tl.x, tl.y, hs)) return 'resize-nw';
    if (near(cx, cy, (tl.x + br.x) / 2, tl.y, hs)) return 'resize-n';
    if (near(cx, cy, br.x, tl.y, hs)) return 'resize-ne';
    if (near(cx, cy, br.x, (tl.y + br.y) / 2, hs)) return 'resize-e';
    if (near(cx, cy, br.x, br.y, hs)) return 'resize-se';
    if (near(cx, cy, (tl.x + br.x) / 2, br.y, hs)) return 'resize-s';
    if (near(cx, cy, tl.x, br.y, hs)) return 'resize-sw';
    if (near(cx, cy, tl.x, (tl.y + br.y) / 2, hs)) return 'resize-w';

    // 检查是否在裁剪区域内
    if (cx >= tl.x && cx <= br.x && cy >= tl.y && cy <= br.y) return 'move';

    return 'none';
  }, [cropParams, videoToContainer]);

  // 鼠标按下
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const mode = getDragModeAt(cx, cy);

    if (mode !== 'none') {
      setDragMode(mode);
      setIsDragging(true);
      dragStartRef.current = {
        x: cx,
        y: cy,
        cropX: cropParams.x,
        cropY: cropParams.y,
        cropW: cropParams.width,
        cropH: cropParams.height,
      };
      e.preventDefault();
    }
  }, [getDragModeAt, cropParams]);

  // 鼠标移动
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (!isDragging) {
      // 更新鼠标样式
      const mode = getDragModeAt(cx, cy);
      const cursorMap: Record<DragMode, string> = {
        'none': 'default',
        'move': 'move',
        'resize-nw': 'nw-resize',
        'resize-n': 'n-resize',
        'resize-ne': 'ne-resize',
        'resize-e': 'e-resize',
        'resize-se': 'se-resize',
        'resize-s': 's-resize',
        'resize-sw': 'sw-resize',
        'resize-w': 'w-resize',
      };
      if (containerRef.current) {
        containerRef.current.style.cursor = cursorMap[mode];
      }
      return;
    }

    const { sx } = getScale();
    const dx = (cx - dragStartRef.current.x) / sx;
    const dy = (cy - dragStartRef.current.y) / sx;

    let newX = cropParams.x;
    let newY = cropParams.y;
    let newW = cropParams.width;
    let newH = cropParams.height;

    switch (dragMode) {
      case 'move':
        newX = Math.max(0, Math.min(videoInfo!.width - cropParams.width, dragStartRef.current.cropX + dx));
        newY = Math.max(0, Math.min(videoInfo!.height - cropParams.height, dragStartRef.current.cropY + dy));
        break;
      case 'resize-se':
        newW = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.width - cropParams.x, dragStartRef.current.cropW + dx));
        newH = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.height - cropParams.y, dragStartRef.current.cropH + dy));
        break;
      case 'resize-nw':
        newW = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropX + dragStartRef.current.cropW, dragStartRef.current.cropW - dx));
        newH = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropY + dragStartRef.current.cropH, dragStartRef.current.cropH - dy));
        newX = Math.max(0, dragStartRef.current.cropX + dx);
        newY = Math.max(0, dragStartRef.current.cropY + dy);
        // 调整后要重新对齐
        if (newX + newW > videoInfo!.width) newW = videoInfo!.width - newX;
        if (newY + newH > videoInfo!.height) newH = videoInfo!.height - newY;
        break;
      case 'resize-ne':
        newW = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.width - cropParams.x, dragStartRef.current.cropW + dx));
        newH = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropY + dragStartRef.current.cropH, dragStartRef.current.cropH - dy));
        newY = Math.max(0, dragStartRef.current.cropY + dy);
        if (newY + newH > videoInfo!.height) newH = videoInfo!.height - newY;
        break;
      case 'resize-sw':
        newW = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropX + dragStartRef.current.cropW, dragStartRef.current.cropW - dx));
        newH = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.height - cropParams.y, dragStartRef.current.cropH + dy));
        newX = Math.max(0, dragStartRef.current.cropX + dx);
        if (newX + newW > videoInfo!.width) newW = videoInfo!.width - newX;
        break;
      case 'resize-n':
        newH = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropY + dragStartRef.current.cropH, dragStartRef.current.cropH - dy));
        newY = Math.max(0, dragStartRef.current.cropY + dy);
        if (newY + newH > videoInfo!.height) newH = videoInfo!.height - newY;
        break;
      case 'resize-s':
        newH = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.height - cropParams.y, dragStartRef.current.cropH + dy));
        break;
      case 'resize-w':
        newW = Math.max(MIN_CROP_SIZE, Math.min(dragStartRef.current.cropX + dragStartRef.current.cropW, dragStartRef.current.cropW - dx));
        newX = Math.max(0, dragStartRef.current.cropX + dx);
        if (newX + newW > videoInfo!.width) newW = videoInfo!.width - newX;
        break;
      case 'resize-e':
        newW = Math.max(MIN_CROP_SIZE, Math.min(videoInfo!.width - cropParams.x, dragStartRef.current.cropW + dx));
        break;
    }

    setCropParams({ x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
  }, [dragMode, isDragging, cropParams, videoInfo, getScale, getDragModeAt, setCropParams]);

  // 鼠标释放
  const onMouseUp = useCallback(() => {
    setDragMode('none');
    setIsDragging(false);
  }, []);

  // 计算裁剪框在容器中的样式
  const cropStyle = (() => {
    if (!videoInfo || containerSize.width === 0) return {};
    const tl = videoToContainer(cropParams.x, cropParams.y);
    const br = videoToContainer(cropParams.x + cropParams.width, cropParams.y + cropParams.height);
    return {
      left: tl.x,
      top: tl.y,
      width: br.x - tl.x,
      height: br.y - tl.y,
    };
  })();

  if (!videoInfo) return null;

  const displayRect = getVideoDisplayRect();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        key={videoInfo.path}
        src={window.electronAPI.getVideoFileUrl(videoInfo.path)}
        className="absolute"
        style={{
          left: displayRect.x,
          top: displayRect.y,
          width: displayRect.w,
          height: displayRect.h,
        }}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
        onLoadedData={() => {
          // 视频数据已加载，确保显示第一帧
          console.log('[视频] 数据加载完成');
        }}
        onError={(e) => {
          const video = e.currentTarget;
          console.error('[视频加载错误]', video.error?.code, video.error?.message);
        }}
      />

      {/* Canvas 覆盖层（用于绘制裁剪框和参考线） */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* 裁剪框覆盖层 */}
      <div
        ref={overlayRef}
        className="absolute border-2 border-blue-400 pointer-events-none"
        style={cropStyle}
      >
        {/* 半透明遮罩 */}
        <div className="absolute inset-0 bg-blue-400/10" />

        {/* 中心十字线 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/50 -translate-x-1/2" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/50 -translate-y-1/2" />

        {/* 拖拽手柄 */}
        {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map((pos) => (
          <div
            key={pos}
            className="absolute w-2 h-2 bg-blue-400 border border-white"
            style={{
              ...(
                pos.includes('n') ? { top: -4 } :
                pos.includes('s') ? { bottom: -4 } : { top: '50%', transform: 'translateY(-50%)' }
              ),
              ...(
                pos.includes('w') ? { left: -4 } :
                pos.includes('e') ? { right: -4 } : { left: '50%', transform: 'translateX(-50%)' }
              ),
              ...(pos.length === 2 ? {} : pos.includes('n') || pos.includes('s') ? { transform: 'translateX(-50%)' } : { transform: 'translateY(-50%)' }),
              ...(pos.length === 2 ? {} : {}),
            }}
          />
        ))}

        {/* 尺寸标注 */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 bg-gray-900/80 px-1.5 py-0.5 rounded whitespace-nowrap">
          {cropParams.width} × {cropParams.height}
        </div>
      </div>

      {/* 播放控制 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 rounded-full px-4 py-2">
        <button
          className="text-white hover:text-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (!video) return;
            if (isPlaying) {
              video.pause();
            } else {
              video.play();
            }
            setIsPlaying(!isPlaying);
          }}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <div className="text-xs text-gray-300 w-20 text-center">
          {currentTime.toFixed(2)}s
        </div>
        <input
          type="range"
          min={0}
          max={videoInfo.duration}
          step={0.1}
          value={currentTime}
          className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          onChange={(e) => {
            const time = parseFloat(e.target.value);
            if (videoRef.current) {
              videoRef.current.currentTime = time;
            }
            setCurrentTime(time);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
