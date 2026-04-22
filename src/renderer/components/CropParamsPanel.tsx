import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export default function CropParamsPanel() {
  const videoInfo = useAppStore((s) => s.videoInfo);
  const cropParams = useAppStore((s) => s.cropParams);
  const setCropParams = useAppStore((s) => s.setCropParams);
  const extractSettings = useAppStore((s) => s.extractSettings);
  const setExtractSettings = useAppStore((s) => s.setExtractSettings);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setIsProcessing = useAppStore((s) => s.setIsProcessing);
  const setProgress = useAppStore((s) => s.setProgress);
  const setFrames = useAppStore((s) => s.setFrames);

  if (!videoInfo) return null;

  const handleInputChange = (field: keyof typeof cropParams, value: string) => {
    const num = parseInt(value) || 0;
    const max = field === 'x' || field === 'width' ? videoInfo.width : videoInfo.height;
    const clamped = Math.max(0, Math.min(max, num));

    // 如果调整 width/height，确保不超出边界
    if (field === 'width') {
      const newX = Math.min(cropParams.x, videoInfo.width - clamped);
      setCropParams({ width: clamped, x: newX });
      return;
    }
    if (field === 'height') {
      const newY = Math.min(cropParams.y, videoInfo.height - clamped);
      setCropParams({ height: clamped, y: newY });
      return;
    }
    if (field === 'x') {
      const newX = Math.min(clamped, videoInfo.width - cropParams.width);
      setCropParams({ x: newX });
      return;
    }
    if (field === 'y') {
      const newY = Math.min(clamped, videoInfo.height - cropParams.height);
      setCropParams({ y: newY });
      return;
    }

    setCropParams({ [field]: clamped });
  };

  const handleResetCrop = () => {
    setCropParams({ x: 0, y: 0, width: videoInfo.width, height: videoInfo.height });
  };

  const handleNudge = (dx: number, dy: number) => {
    setCropParams({
      x: Math.max(0, Math.min(videoInfo.width - cropParams.width, cropParams.x + dx)),
      y: Math.max(0, Math.min(videoInfo.height - cropParams.height, cropParams.y + dy)),
    });
  };

  const handleExtract = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: 100, phase: 'extracting', message: '准备提取...' });

    try {
      // 设置导出目录
      let outputDir = extractSettings.outputDir;
      if (!outputDir) {
        outputDir = await window.electronAPI.selectOutputDir();
        if (!outputDir) {
          setIsProcessing(false);
          setProgress(null);
          return;
        }
        setExtractSettings({ outputDir });
      }

      const result = await window.electronAPI.extractFrames(videoInfo, cropParams, extractSettings);

      if (result.success && result.framePaths) {
        const frames = result.framePaths.map((path: string, i: number) => ({
          id: `frame-${i}`,
          index: i,
          path,
          thumbnailPath: path,
          selected: true,
        }));
        setFrames(frames);
        setViewMode('frames');
      } else {
        alert('提取失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      alert('提取失败: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  // 监听提取进度
  useEffect(() => {
    const cleanup = window.electronAPI.onExtractProgress((p) => {
      setProgress(p);
    });
    return () => { cleanup(); };
  }, [setProgress]);

  // 计算截取后的时长和总帧数
  const clipDuration = extractSettings.endTime - extractSettings.startTime;
  const totalFrames = Math.floor(clipDuration * extractSettings.targetFps);

  return (
    <div className="p-3 space-y-3">
      {/* 裁剪参数 */}
      <div className="panel">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          裁剪参数
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">X 坐标</label>
            <input
              type="number"
              className="input-field w-full"
              value={cropParams.x}
              min={0}
              max={videoInfo.width - cropParams.width}
              onChange={(e) => handleInputChange('x', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Y 坐标</label>
            <input
              type="number"
              className="input-field w-full"
              value={cropParams.y}
              min={0}
              max={videoInfo.height - cropParams.height}
              onChange={(e) => handleInputChange('y', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">宽度</label>
            <input
              type="number"
              className="input-field w-full"
              value={cropParams.width}
              min={1}
              max={videoInfo.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">高度</label>
            <input
              type="number"
              className="input-field w-full"
              value={cropParams.height}
              min={1}
              max={videoInfo.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
            />
          </div>
        </div>

        {/* 微调按钮 */}
        <div className="flex justify-center mb-3">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => handleNudge(0, -1)}>↑</button>
            <div />
            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => handleNudge(-1, 0)}>←</button>
            <button className="btn-secondary py-1 px-2 text-xs" onClick={handleResetCrop}>全屏</button>
            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => handleNudge(1, 0)}>→</button>
            <div />
            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => handleNudge(0, 1)}>↓</button>
            <div />
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          裁剪后: {cropParams.width} × {cropParams.height}
        </p>
      </div>

      {/* 提取预览信息 */}
      <div className="panel">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">提取预览</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">目标帧率</span>
            <span className="text-gray-300">{extractSettings.targetFps} fps</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">预计总帧数</span>
            <span className="text-blue-400 font-medium">{totalFrames} 帧</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">输出格式</span>
            <span className="text-gray-300 uppercase">{extractSettings.outputFormat}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">输出尺寸</span>
            <span className="text-gray-300">
              {Math.round(cropParams.width * extractSettings.scalePercent / 100)} × {Math.round(cropParams.height * extractSettings.scalePercent / 100)}
            </span>
          </div>
        </div>
      </div>

      {/* 提取按钮 */}
      <button
        className="btn-primary w-full py-3 text-base"
        onClick={handleExtract}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          提取帧
        </span>
      </button>
    </div>
  );
}
