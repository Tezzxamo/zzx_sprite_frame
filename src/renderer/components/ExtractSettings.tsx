import { useAppStore } from '../stores/appStore';

export default function ExtractSettings() {
  const videoInfo = useAppStore((s) => s.videoInfo);
  const extractSettings = useAppStore((s) => s.extractSettings);
  const setExtractSettings = useAppStore((s) => s.setExtractSettings);

  if (!videoInfo) return null;

  const totalFrames = Math.floor(videoInfo.duration * extractSettings.targetFps);

  return (
    <div className="panel m-3 mt-0">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        提取设置
      </h3>

      <div className="space-y-3">
        {/* 帧率设置 */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500">每秒提取帧数</label>
            <span className="text-xs text-blue-400 font-medium">{extractSettings.targetFps} fps</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={extractSettings.targetFps}
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

        {/* 输出格式 */}
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
