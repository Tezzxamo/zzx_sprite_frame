import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export default function FrameList() {
  const frames = useAppStore((s) => s.frames);
  const setViewMode = useAppStore((s) => s.setViewMode);

  const [frameImages, setFrameImages] = useState<Record<string, string>>({});
  const [, setSelectedId] = useState<string | null>(null);

  // 加载帧缩略图
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const frame of frames) {
        try {
          const base64 = await window.electronAPI.readFile(frame.path);
          if (base64) {
            images[frame.id] = base64;
          }
        } catch {
          // 忽略加载失败
        }
      }
      setFrameImages(images);
    };

    if (frames.length > 0) {
      loadImages();
    }
  }, [frames]);

  const handleToggleSelection = useCallback((id: string) => {
    const store = useAppStore.getState();
    store.toggleFrameSelection(id);
  }, []);

  const handleDeleteFrame = useCallback(async (id: string) => {
    const frame = frames.find((f) => f.id === id);
    if (!frame) return;

    try {
      await window.electronAPI.deleteTempFrame(frame.path);
      useAppStore.getState().deleteFrame(id);
    } catch (err) {
      console.error('删除帧失败:', err);
    }
  }, [frames]);

  const handleSelectAll = useCallback((selected: boolean) => {
    useAppStore.getState().selectAllFrames(selected);
  }, []);

  const selectedCount = frames.filter((f) => f.selected).length;

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-3 shrink-0">
        <button
          className="btn-secondary text-xs py-1.5 px-3"
          onClick={() => setViewMode('crop')}
        >
          ← 返回裁剪
        </button>

        <div className="flex-1" />

        <span className="text-xs text-gray-500">
          共 {frames.length} 帧，已选 {selectedCount} 帧
        </span>

        <button
          className="btn-secondary text-xs py-1.5 px-3"
          onClick={() => handleSelectAll(true)}
        >
          全选
        </button>
        <button
          className="btn-secondary text-xs py-1.5 px-3"
          onClick={() => handleSelectAll(false)}
        >
          全不选
        </button>
      </div>

      {/* 帧网格 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {frames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">暂无帧数据</p>
            <p className="text-xs mt-1">请先提取帧</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className={`group relative bg-gray-800 rounded-lg border-2 overflow-hidden cursor-pointer transition-all
                  ${frame.selected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-700 hover:border-gray-600'}`}
                onClick={() => {
                  setSelectedId(frame.id);
                  handleToggleSelection(frame.id);
                }}
              >
                {/* 缩略图 */}
                <div className="aspect-square bg-gray-900 flex items-center justify-center">
                  {frameImages[frame.id] ? (
                    <img
                      src={frameImages[frame.id]}
                      alt={`Frame ${frame.index + 1}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </div>

                {/* 帧信息 */}
                <div className="px-2 py-1.5 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">#{frame.index + 1}</span>
                    {frame.selected && (
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  className="absolute top-1 right-1 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs 
                             opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFrame(frame.id);
                  }}
                >
                  ×
                </button>

                {/* 选中遮罩 */}
                {frame.selected && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
