import type { VideoInfo as VideoInfoType } from '../../types';

interface Props {
  info: VideoInfoType;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export default function VideoInfo({ info }: Props) {
  return (
    <div className="panel m-3 mb-0">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        视频信息
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">文件名</span>
          <span className="text-gray-300 truncate max-w-[140px]" title={info.name}>{info.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">分辨率</span>
          <span className="text-gray-300">{info.width} × {info.height}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">时长</span>
          <span className="text-gray-300">{formatDuration(info.duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">帧率</span>
          <span className="text-gray-300">{info.fps} fps</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">编码</span>
          <span className="text-gray-300">{info.codec}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">码率</span>
          <span className="text-gray-300">{info.bitrate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">文件大小</span>
          <span className="text-gray-300">{formatFileSize(info.size)}</span>
        </div>
      </div>
    </div>
  );
}
