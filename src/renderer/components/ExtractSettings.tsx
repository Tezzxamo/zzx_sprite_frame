import { useAppStore } from '../stores/appStore';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default function ExtractSettings() {
  const videoInfo = useAppStore((s) => s.videoInfo);
  const extractSettings = useAppStore((s) => s.extractSettings);
  const setExtractSettings = useAppStore((s) => s.setExtractSettings);

  if (!videoInfo) return null;

  const { startTime, endTime, targetFps, chromaKey } = extractSettings;
  const clipDuration = endTime - startTime;
  const totalFrames = Math.floor(clipDuration * targetFps);

  const handleStartTimeChange = (value: number) => {
    const newStart = Math.min(value, endTime - 0.1);
    setExtractSettings({ startTime: newStart });
  };

  const handleEndTimeChange = (value: number) => {
    const newEnd = Math.max(value, startTime + 0.1);
    setExtractSettings({ endTime: Math.min(newEnd, videoInfo.duration) });
  };

  return (
    <div className="panel m-3 mt-0">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        提取设置
      </h3>

      <div className="space-y-4">
        {/* ========== 时间范围裁剪 ========== */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-500">截取时间范围</label>
            <span className="text-xs text-blue-400 font-mono">
              {formatTime(startTime)} ~ {formatTime(endTime)}
            </span>
          </div>

          {/* 开始时间 */}
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-500">开始</span>
              <span className="text-[10px] text-gray-400">{formatTime(startTime)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={videoInfo.duration}
              step={0.1}
              value={startTime}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
            />
          </div>

          {/* 结束时间 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-500">结束</span>
              <span className="text-[10px] text-gray-400">{formatTime(endTime)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={videoInfo.duration}
              step={0.1}
              value={endTime}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
            />
          </div>

          <div className="mt-1.5 text-[10px] text-gray-500 text-center">
            截取时长: <span className="text-blue-400 font-medium">{clipDuration.toFixed(2)}s</span>
          </div>
        </div>

        {/* ========== 帧率设置 ========== */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500">每秒提取帧数</label>
            <span className="text-xs text-blue-400 font-medium">{targetFps} fps</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={targetFps}
            className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            onChange={(e) => setExtractSettings({ targetFps: parseInt(e.target.value) })}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">1 fps</span>
            <span className="text-[10px] text-gray-600">60 fps</span>
          </div>
        </div>

        {/* 总帧数显示 */}
        <div className="bg-gray-750 rounded p-2 text-center">
          <span className="text-xs text-gray-500">预计提取 </span>
          <span className="text-sm font-bold text-blue-400">{totalFrames}</span>
          <span className="text-xs text-gray-500"> 帧</span>
        </div>

        {/* ========== 绿幕抠图 ========== */}
        <div className="border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <label className="text-xs text-gray-300 font-medium">绿幕抠图</label>
            </div>
            <button
              className={`relative w-9 h-5 rounded-full transition-colors ${chromaKey.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
              onClick={() => setExtractSettings({
                chromaKey: { ...chromaKey, enabled: !chromaKey.enabled }
              })}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${chromaKey.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {chromaKey.enabled && (
            <div className="space-y-2 mt-2">
              {/* 颜色选择 */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">颜色</label>
                <input
                  type="color"
                  value={chromaKey.color}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  onChange={(e) => setExtractSettings({
                    chromaKey: { ...chromaKey, color: e.target.value }
                  })}
                />
                <span className="text-xs text-gray-400 font-mono">{chromaKey.color}</span>
                <span
                  className="w-4 h-4 rounded border border-gray-500"
                  style={{ backgroundColor: chromaKey.color }}
                />
              </div>

              {/* 相似度 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-500">相似度</span>
                  <span className="text-[10px] text-gray-400">{chromaKey.similarity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={chromaKey.similarity}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                  onChange={(e) => setExtractSettings({
                    chromaKey: { ...chromaKey, similarity: parseFloat(e.target.value) }
                  })}
                />
              </div>

              {/* 边缘羽化 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-500">边缘羽化</span>
                  <span className="text-[10px] text-gray-400">{chromaKey.blend.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.0}
                  step={0.01}
                  value={chromaKey.blend}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                  onChange={(e) => setExtractSettings({
                    chromaKey: { ...chromaKey, blend: parseFloat(e.target.value) }
                  })}
                />
              </div>

              <p className="text-[10px] text-gray-600">
                提示: 输出格式请选择 PNG 或 WebP 以保留透明背景
              </p>
            </div>
          )}
        </div>

        {/* ========== 输出格式 ========== */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">输出格式</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['png', 'jpg', 'webp', 'bmp'] as const).map((fmt) => (
              <button
                key={fmt}
                className={`py-1.5 px-2 rounded text-xs font-medium uppercase transition-colors
                  ${extractSettings.outputFormat === fmt
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                onClick={() => setExtractSettings({ outputFormat: fmt })}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* 质量设置（仅 jpg/webp） */}
        {(extractSettings.outputFormat === 'jpg' || extractSettings.outputFormat === 'webp') && (
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500">图片质量</label>
              <span className="text-xs text-blue-400">{extractSettings.quality}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={extractSettings.quality}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              onChange={(e) => setExtractSettings({ quality: parseInt(e.target.value) })}
            />
          </div>
        )}

        {/* 缩放比例 */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500">输出缩放</label>
            <span className="text-xs text-blue-400">{extractSettings.scalePercent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={extractSettings.scalePercent}
            className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            onChange={(e) => setExtractSettings({ scalePercent: parseInt(e.target.value) })}
          />
        </div>

        {/* 命名模板 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">命名模板</label>
          <input
            type="text"
            className="input-field w-full text-xs"
            value={extractSettings.namingPattern}
            placeholder="frame_{0001}"
            onChange={(e) => setExtractSettings({ namingPattern: e.target.value })}
          />
          <p className="text-[10px] text-gray-600 mt-1">使用 {'{0001}'} 表示序号位数</p>
        </div>
      </div>
    </div>
  );
}
