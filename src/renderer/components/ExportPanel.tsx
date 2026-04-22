import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export default function ExportPanel() {
  const frames = useAppStore((s) => s.frames);
  const extractSettings = useAppStore((s) => s.extractSettings);
  const setExtractSettings = useAppStore((s) => s.setExtractSettings);
  const videoInfo = useAppStore((s) => s.videoInfo);
  const setIsProcessing = useAppStore((s) => s.setIsProcessing);
  const setProgress = useAppStore((s) => s.setProgress);

  const [isExporting, setIsExporting] = useState(false);

  const selectedFrames = frames.filter((f) => f.selected);
  const selectedCount = selectedFrames.length;

  // 监听导出进度
  useEffect(() => {
    const cleanup = window.electronAPI.onExportProgress((progress) => {
      setProgress(progress);
    });
    return () => { cleanup(); };
  }, []);

  const handleSelectOutputDir = async () => {
    const dir = await window.electronAPI.selectOutputDir();
    if (dir) {
      setExtractSettings({ outputDir: dir });
    }
  };

  const handleExport = async () => {
    if (selectedCount === 0) {
      alert('请先选择要导出的帧');
      return;
    }

    let outputDir = extractSettings.outputDir;
    if (!outputDir) {
      outputDir = await window.electronAPI.selectOutputDir();
      if (!outputDir) return;
      setExtractSettings({ outputDir });
    }

    setIsExporting(true);
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedCount, phase: 'saving', message: '准备导出...' });

    try {
      const paths = selectedFrames.map((f) => f.path);
      const result = await window.electronAPI.exportFrames(paths, { ...extractSettings, outputDir });

      if (result.success) {
        alert(`导出成功！\n${selectedCount} 帧已保存到:\n${outputDir}`);
      } else {
        alert('导出失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      alert('导出失败: ' + (err as Error).message);
    } finally {
      setIsExporting(false);
      setIsProcessing(false);
      setProgress(null);
    }
  };

  if (!videoInfo) return null;

  return (
    <div className="p-3 space-y-3">
      <div className="panel">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导出设置
        </h3>

        {/* 输出目录 */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">输出目录</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1 text-xs truncate"
              value={extractSettings.outputDir || '未选择'}
              readOnly
              placeholder="选择输出目录"
            />
            <button
              className="btn-secondary text-xs py-1.5 px-2 shrink-0"
              onClick={handleSelectOutputDir}
            >
              浏览
            </button>
          </div>
        </div>

        {/* 帧选择状态 */}
        <div className="bg-gray-750 rounded p-2.5 mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">已选择</span>
            <span className="text-blue-400 font-medium">{selectedCount} / {frames.length} 帧</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: frames.length > 0 ? `${(selectedCount / frames.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* 导出预览 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">输出格式</span>
            <span className="text-gray-300 uppercase">{extractSettings.outputFormat}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">命名规则</span>
            <span className="text-gray-300 truncate max-w-[120px]">{extractSettings.namingPattern}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">输出尺寸</span>
            <span className="text-gray-300">
              {Math.round(useAppStore.getState().cropParams.width * extractSettings.scalePercent / 100)} × {Math.round(useAppStore.getState().cropParams.height * extractSettings.scalePercent / 100)}
            </span>
          </div>
          {extractSettings.outputFormat !== 'png' && (
            <div className="flex justify-between">
              <span className="text-gray-500">图片质量</span>
              <span className="text-gray-300">{extractSettings.quality}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 导出按钮 */}
      <button
        className="btn-success w-full py-3 text-base"
        disabled={isExporting || selectedCount === 0}
        onClick={handleExport}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          导出帧
        </span>
      </button>

      {isExporting && (
        <p className="text-xs text-gray-500 text-center">正在导出，请稍候...</p>
      )}
    </div>
  );
}
