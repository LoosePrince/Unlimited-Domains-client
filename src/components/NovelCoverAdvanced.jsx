import React, { useRef, useEffect, useState } from 'react';

const NovelCoverAdvanced = ({
  title,
  author,
  platform = '无限域',
  theme = 'default',
  coverUrl = null,
  size = 'md',
  className = ''
}) => {
  // 计算最佳字体大小和布局
  const calculateLayout = (title, containerHeight = 160, containerWidth = 160) => {
    const chars = title.split('');
    const titleLength = chars.length;

    // 基于容器高度和字符数量计算最佳字体大小
    let fontSize, columns, charsPerColumn;
    const availableHeight = containerHeight - 32; // 减去上下padding
    const availableWidth = containerWidth * 0.4; // 标题区域占容器宽度的40%

    if (titleLength <= 6) {
      // 短标题：单列，大字体
      fontSize = Math.min(24, availableHeight / titleLength * 0.8, availableWidth * 0.8);
      columns = 1;
      charsPerColumn = titleLength;
    } else if (titleLength <= 12) {
      // 中等标题：单列或双列
      const singleColumnFontSize = Math.min(availableHeight / titleLength * 0.8, availableWidth * 0.6);
      const doubleColumnFontSize = Math.min(availableHeight / Math.ceil(titleLength / 2) * 0.8, availableWidth / 2 * 0.6);

      if (singleColumnFontSize >= 14) {
        fontSize = singleColumnFontSize;
        columns = 1;
        charsPerColumn = titleLength;
      } else {
        fontSize = doubleColumnFontSize;
        columns = 2;
        charsPerColumn = Math.ceil(titleLength / 2);
      }
    } else if (titleLength <= 18) {
      // 较长标题：双列
      fontSize = Math.min(availableHeight / Math.ceil(titleLength / 2) * 0.8, availableWidth / 2 * 0.6);
      columns = 2;
      charsPerColumn = Math.ceil(titleLength / 2);
    } else {
      // 很长标题：三列
      fontSize = Math.min(availableHeight / Math.ceil(titleLength / 3) * 0.8, availableWidth / 3 * 0.6);
      columns = 3;
      charsPerColumn = Math.ceil(titleLength / 3);
    }

    // 确保字体大小在合理范围内
    fontSize = Math.max(8, Math.min(24, fontSize));

    return {
      fontSize: Math.round(fontSize),
      columns,
      charsPerColumn,
      chars
    };
  };
  const themes = {
    default: {
      bg: 'from-slate-50 via-slate-100 to-slate-200',
      text: 'text-slate-800',
      author: 'text-slate-700',
      platform: 'text-slate-600',
      accent: 'bg-slate-500',
      border: 'border-slate-200'
    },
    classic: {
      bg: 'from-amber-50 via-amber-100 to-amber-200',
      text: 'text-amber-900',
      author: 'text-amber-800',
      platform: 'text-amber-700',
      accent: 'bg-amber-600',
      border: 'border-amber-200'
    },
    modern: {
      bg: 'from-blue-50 via-blue-100 to-blue-200',
      text: 'text-blue-900',
      author: 'text-blue-800',
      platform: 'text-blue-700',
      accent: 'bg-blue-600',
      border: 'border-blue-200'
    },
    elegant: {
      bg: 'from-purple-50 via-purple-100 to-purple-200',
      text: 'text-purple-900',
      author: 'text-purple-800',
      platform: 'text-purple-700',
      accent: 'bg-purple-600',
      border: 'border-purple-200'
    }
  };

  const currentTheme = themes[theme] || themes.default;
  
  // 尺寸样式配置
  const sizeClasses = {
    xs: 'w-16 h-20',
    sm: 'w-20 h-28', 
    md: 'w-32 h-42',
    lg: 'w-40 h-56',
    xl: 'w-48 h-64'
  };
  
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 160, height: 160 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // 初始测量
    const timer = setTimeout(updateSize, 100);

    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver;
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    } else {
      // 降级方案：监听窗口大小变化
      window.addEventListener('resize', updateSize);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
    };
  }, []);

  const layout = calculateLayout(title, containerSize.height, containerSize.width);

  return (
    <div ref={containerRef} className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden shadow-lg border ${className}`}>
      {/* 如果有封面图片，优先显示封面 */}
      {coverUrl && coverUrl !== 'none' ? (
        <img
          src={coverUrl}
          alt={`${title} 封面`}
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          {/* 背景装饰 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.bg} ${currentTheme.border}`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-slate-400 rounded-full"></div>
              <div className="absolute bottom-8 right-8 w-12 h-12 border border-slate-400 rounded-full"></div>
              <div className="absolute top-1/2 left-2 w-8 h-8 border border-slate-400 rounded-full"></div>
              <div className="absolute top-1/3 right-4 w-6 h-6 border border-slate-400 rounded-full"></div>
            </div>
          </div>
        </>
      )}

      {/* 当没有封面时，显示文字信息和装饰 */}
      {(!coverUrl || coverUrl === 'none') && (
        <>
          {/* 书名 - 纵向排列在左侧，自动缩放和换行 */}
          <div className="absolute left-4 top-4 bottom-4 flex flex-col justify-center">
            {layout.columns === 1 ? (
              // 单列显示
              layout.chars.map((char, index) => (
                <div
                  key={index}
                  className={`font-bold ${currentTheme.text} leading-none drop-shadow-sm`}
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    fontSize: `${layout.fontSize}px`,
                    marginBottom: `${Math.max(1, layout.fontSize * 0.1)}px`
                  }}
                >
                  {char}
                </div>
              ))
            ) : (
              // 多列显示
              Array.from({ length: layout.columns }, (_, colIndex) => (
                <div key={colIndex} className="flex flex-col" style={{ marginRight: `${Math.max(2, layout.fontSize * 0.15)}px` }}>
                  {layout.chars.slice(colIndex * layout.charsPerColumn, (colIndex + 1) * layout.charsPerColumn).map((char, charIndex) => (
                    <div
                      key={charIndex}
                      className={`font-bold ${currentTheme.text} leading-none drop-shadow-sm`}
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        fontSize: `${layout.fontSize}px`,
                        marginBottom: `${Math.max(1, layout.fontSize * 0.1)}px`
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* 作者和平台信息 - 右下角 */}
          <div className="absolute bottom-4 right-4 text-right max-w-[80%]">
            <div
              className={`font-medium ${currentTheme.author} mb-1 drop-shadow-sm break-words overflow-hidden`}
              style={{
                fontSize: Math.min(14, Math.max(10, containerSize.width * 0.08)) + 'px',
                lineHeight: '1.2'
              }}
            >
              {author}
            </div>
            <div
              className={`${currentTheme.platform} font-medium break-words overflow-hidden`}
              style={{
                fontSize: Math.min(12, Math.max(8, containerSize.width * 0.06)) + 'px',
                lineHeight: '1.2'
              }}
            >
              {platform}
            </div>
          </div>

          {/* 装饰点 */}
          <div className={`absolute top-3 left-3 w-3 h-3 ${currentTheme.accent} rounded-full opacity-60`}></div>
          <div className={`absolute top-3 right-3 w-2 h-2 ${currentTheme.accent} rounded-full opacity-60`}></div>
          <div className={`absolute bottom-3 left-3 w-2 h-2 ${currentTheme.accent} rounded-full opacity-40`}></div>

          {/* 主题标识 */}
          <div className="absolute top-2 right-2">
            <div className={`w-2 h-2 ${currentTheme.accent} rounded-full opacity-80`}></div>
          </div>
        </>
      )}
    </div>
  );
};

export default NovelCoverAdvanced;
