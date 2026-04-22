import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export default function VideoDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setVideoInfo = useAppStore((s) => s.setVideoInfo);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }

    try {
      // 在 Electron 中，File 对象的 path 属性包含完整路径
      const path = (file as any).path as string;
      if (!path) {
        alert('无法获取文件路径，请使用桌面应用版本');
        return;
      }
      const info = await window.electronAPI.getVideoInfo(path);
      setVideoInfo(info);
    } catch (err) {
      alert('读取视频失败: ' + (err as Error).message);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onClickSelect = async () => {
    try {
      const info = await window.electronAPI.selectVideoFile();
      if (info) {
        setVideoInfo(info);
      }
    } catch (err) {
      alert('选择文件失败: ' + (err as Error).message);
    }
  };

  return (
    <div
      className={`w-full max-w-xl h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-105' 
          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
        }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileSelect}
      />

      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-gray-200">拖拽视频到此处</p>
        <p className="text-sm text-gray-500 mt-1">或点击选择文件</p>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onClickSelect();
          }}
        >
          选择视频文件
        </button>
      </div>

      <p className="text-xs text-gray-600">
        支持 MP4, MOV, AVI, WEBM, MKV 等格式
      </p>
    </div>
  );
}
