import React from 'react';

const NovelCover = ({ title, author, platform = '无限域', className = '' }) => {
  return (
    <div className={`relative w-48 h-64 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-lg overflow-hidden shadow-lg border border-slate-200 ${className}`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-slate-400 rounded-full"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border border-slate-400 rounded-full"></div>
        <div className="absolute top-1/2 left-2 w-8 h-8 border border-slate-400 rounded-full"></div>
        <div className="absolute top-1/3 right-4 w-6 h-6 border border-slate-400 rounded-full"></div>
      </div>

      {/* 书名 - 纵向排列在左侧 */}
      <div className="absolute left-6 top-8 bottom-8 flex flex-col justify-center">
        {title.split('').map((char, index) => (
          <div
            key={index}
            className="text-2xl font-bold text-slate-800 mb-1 leading-none drop-shadow-sm"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed'
            }}
          >
            {char}
          </div>
        ))}
      </div>

      {/* 作者和平台信息 - 右下角 */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-sm font-medium text-slate-700 mb-1 drop-shadow-sm">
          {author}
        </div>
        <div className="text-xs text-slate-600 font-medium">
          {platform}
        </div>
      </div>

      {/* 左上角装饰 */}
      <div className="absolute top-3 left-3 w-3 h-3 bg-slate-500 rounded-full opacity-60"></div>

      {/* 右上角装饰 */}
      <div className="absolute top-3 right-3 w-2 h-2 bg-slate-500 rounded-full opacity-60"></div>

      {/* 左下角装饰 */}
      <div className="absolute bottom-3 left-3 w-2 h-2 bg-slate-500 rounded-full opacity-40"></div>
    </div>
  );
};

export default NovelCover;
