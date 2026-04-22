import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import VideoDropZone from './components/VideoDropZone';
import VideoInfo from './components/VideoInfo';
import CropCanvas from './components/CropCanvas';
import PreviewPanel from './components/PreviewPanel';
import CropParamsPanel from './components/CropParamsPanel';
import ExtractSettings from './components/ExtractSettings';
import FrameList from './components/FrameList';
import ExportPanel from './components/ExportPanel';

function App() {
  const { viewMode, videoInfo, isProcessing, progress } = useAppStore();

  // 监听外部文件打开（拖拽到应用图标）
  useEffect(() => {
    const cleanup = window.electronAPI.onOpenFile(async (filePath) => {
      try {
        const info = await window.electronAPI.getVideoInfo(filePath);
        useAppStore.getState().setVideoInfo(info);
      } catch (err) {
        alert('无法读取视频文件: ' + (err as Error).message);
      }
    });
    return () => { cleanup(); };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* 顶部工具栏 */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-sm">SF</div>
          <h1 className="font-semibold text-sm">ZZX SpriteFrame</h1>
          <span className="text-xs text-gray-500">视频转序列帧工具</span>
        </div>
        <div className="flex items-center gap-2">
          {videoInfo && (
            <button
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => useAppStore.getState().setVideoInfo(null)}
            >
              重新导入
            </button>
          )}
          <span className="text-xs text-gray-500">v0.1.0</span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'import' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <VideoDropZone />
          </div>
        )}

        {viewMode === 'crop' && videoInfo && (
          <>
            {/* 左侧面板 */}
            <aside className="w-72 bg-gray-850 border-r border-gray-700 flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
              <VideoInfo info={videoInfo} />
              <ExtractSettings />
            </aside>

            {/* 中间预览区域 */}
            <section className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex">
                <div className="flex-1 p-4 flex flex-col">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    原始画面（拖拽裁剪区域）
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-gray-950 rounded-lg border border-gray-700 overflow-hidden">
                    <CropCanvas />
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    裁剪预览
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-gray-950 rounded-lg border border-gray-700 overflow-hidden">
                    <PreviewPanel />
                  </div>
                </div>
              </div>
            </section>

            {/* 右侧面板 */}
            <aside className="w-72 bg-gray-850 border-l border-gray-700 flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
              <CropParamsPanel />
            </aside>
          </>
        )}

        {viewMode === 'frames' && (
          <>
            {/* 左侧：帧列表 */}
            <section className="flex-1 flex flex-col min-w-0">
              <FrameList />
            </section>

            {/* 右侧：导出面板 */}
            <aside className="w-80 bg-gray-850 border-l border-gray-700 flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
              <ExportPanel />
            </aside>
          </>
        )}
      </main>

      {/* 底部进度条 */}
      {isProcessing && progress && (
        <footer className="h-10 bg-gray-800 border-t border-gray-700 flex items-center px-4 gap-3 shrink-0">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-24 text-right">
            {progress.current}/{progress.total}
          </span>
          <span className="text-xs text-gray-300">{progress.message}</span>
        </footer>
      )}
    </div>
  );
}

export default App;
