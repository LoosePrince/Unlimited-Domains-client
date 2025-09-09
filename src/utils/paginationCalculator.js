/**
 * 分页计算模块
 * 提供文本分页计算功能，将长文本按指定容器尺寸分割为多个页面
 */

/**
 * 文本清理函数 - 移除无意义的空行
 * @param {string} text - 待清理的文本
 * @returns {string} 清理后的文本
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\n\s*\n\s*\n+/g, '\n\n')  // 将3个或更多连续空行替换为2个
    .replace(/\n\s*\n\s*\n+/g, '\n\n')  // 再次处理，确保没有更多连续空行
    .replace(/^\s+/, '')  // 移除开头空白
    .replace(/\s+$/, ''); // 移除结尾空白
};

/**
 * 按段落分割文本
 * @param {string} text - 待分割的文本
 * @returns {string[]} 段落数组
 */
export const splitTextIntoParagraphs = (text) => {
  if (!text || typeof text !== 'string') return [];

  // 先尝试按双换行分割
  let paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // 如果没有分割出段落，尝试按单换行分割
  if (paragraphs.length === 0) {
    paragraphs = text.split(/\n/).filter(p => p.trim().length > 0);
  }

  // 如果还是没有，就整个作为一个段落
  if (paragraphs.length === 0) {
    paragraphs = [text.trim()];
  }

  return paragraphs;
};

/**
 * 按句子分割文本
 * @param {string} text - 待分割的文本
 * @returns {string[]} 句子数组
 */
export const splitTextIntoSentences = (text) => {
  if (!text || typeof text !== 'string') return [];

  const sentences = text.split(/[。！？；.!?;]\s*/).filter(s => s.trim().length > 0);

  // 如果没有分割出句子，尝试按逗号分割
  if (sentences.length === 0) {
    return text.split(/[，,]\s*/).filter(s => s.trim().length > 0);
  }

  return sentences;
};

/**
 * 创建文本高度测量函数
 * @param {Object} options - 测量选项
 * @param {number} options.containerWidth - 容器宽度
 * @param {string} options.fontFamily - 字体族
 * @param {number} options.fontSize - 字体大小
 * @param {number} options.lineHeight - 行高
 * @param {string} options.textColor - 文字颜色
 * @param {string} options.backgroundColor - 背景颜色
 * @returns {Function} 测量函数，接受文本参数返回高度
 */
export const createTextHeightMeasurer = (options) => {
  const {
    containerWidth,
    fontFamily,
    fontSize,
    lineHeight,
    textColor,
    backgroundColor
  } = options;

  return (text) => {
    if (!text.trim()) return 0;

    // 创建测试容器
    const testContainer = document.createElement('div');
    testContainer.className = 'prose max-w-none';
    testContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${containerWidth}px;
      max-width: none;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: ${textColor};
      background-color: ${backgroundColor};
      padding: 0;
      margin: 0;
      border: none;
      box-sizing: border-box;
    `;
    document.body.appendChild(testContainer);

    // 手动应用Tailwind CSS的段落间距规则
    const style = document.createElement('style');
    style.setAttribute('data-pagination', 'true');
    style.textContent = `
      .mb-5 { margin-bottom: 1.25rem; }
      .first\\:mt-0:first-child { margin-top: 0; }
      .last\\:mb-0:last-child { margin-bottom: 0; }
    `;
    document.head.appendChild(style);

    // 将文本按行分割并过滤空行
    const lines = text.split('\n').filter(line => line.trim());

    // 为每个非空行创建p标签，与实际渲染完全一致
    lines.forEach((line, index) => {
      const p = document.createElement('p');
      p.className = 'mb-5 first:mt-0 last:mb-0';
      p.style.cssText = `
        text-indent: 2em;
        line-height: ${lineHeight};
        font-size: ${fontSize}px;
        font-family: ${fontFamily};
        word-wrap: break-word;
        overflow-wrap: break-word;
      `;
      p.textContent = line;
      testContainer.appendChild(p);
    });

    const height = testContainer.scrollHeight;

    // 清理DOM元素
    document.body.removeChild(testContainer);
    document.head.removeChild(style);

    return height;
  };
};

/**
 * 计算文本分页
 * @param {Object} params - 分页参数
 * @param {string} params.title - 章节标题
 * @param {string} params.content - 正文内容
 * @param {Object} params.containerSize - 容器尺寸
 * @param {number} params.containerSize.width - 容器宽度
 * @param {number} params.containerSize.height - 容器高度
 * @param {number} params.titleHeight - 标题高度（可选）
 * @param {Object} params.fontSettings - 字体设置
 * @param {string} params.fontSettings.fontFamily - 字体族
 * @param {number} params.fontSettings.fontSize - 字体大小
 * @param {number} params.fontSettings.lineHeight - 行高
 * @param {string} params.fontSettings.textColor - 文字颜色
 * @param {string} params.fontSettings.backgroundColor - 背景颜色
 * @returns {Promise<Object>} 分页结果
 */
export const calculatePagination = async (params) => {
  const {
    title,
    content,
    containerSize,
    titleHeight: providedTitleHeight,
    fontSettings
  } = params;

  const { width: containerWidth, height: containerHeight } = containerSize;
  const { fontFamily, fontSize, lineHeight, textColor, backgroundColor } = fontSettings;

  // 等待DOM渲染完成
  await new Promise(resolve => setTimeout(resolve, 100));

  // 计算标题高度（如果未提供）
  let titleHeight = providedTitleHeight || 0;
  if (!providedTitleHeight && title) {
    const tempTitle = document.createElement('h1');
    tempTitle.textContent = title;
    tempTitle.className = 'text-2xl font-semibold mb-6 flex-shrink-0';
    tempTitle.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${containerWidth}px;
      font-family: ${fontFamily};
      color: ${textColor};
    `;
    document.body.appendChild(tempTitle);
    titleHeight = tempTitle.offsetHeight + 24; // 包含mb-6的24px
    document.body.removeChild(tempTitle);
  }

  // 计算第一页和其他页面的可用高度
  const availableHeightForFirstPage = containerHeight - titleHeight;
  const availableHeightForOtherPages = containerHeight;

  // 验证容器尺寸
  if (availableHeightForOtherPages <= 0 || containerWidth <= 0) {
    throw new Error(`无效的容器尺寸: ${containerWidth}x${availableHeightForOtherPages}`);
  }

  // 创建高度测量函数
  const measureParagraphsHeight = createTextHeightMeasurer({
    containerWidth,
    fontFamily,
    fontSize,
    lineHeight,
    textColor,
    backgroundColor
  });

  // 预处理文本
  const cleanedText = cleanText(content);

  // 使用字符级分页算法
  const pagesData = [];
  let currentIndex = 0;

  while (currentIndex < cleanedText.length) {
    // 判断当前是否为第一页（需要为标题预留空间）
    const isFirstPage = pagesData.length === 0;
    const availableHeight = isFirstPage ? availableHeightForFirstPage : availableHeightForOtherPages;

    // 使用二分查找找到最精确的分页边界
    let left = currentIndex;
    let right = cleanedText.length;
    let maxFitIndex = currentIndex;

    // 二分查找最大能容纳的字符数
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const testContent = cleanedText.slice(currentIndex, mid);
      const testHeight = measureParagraphsHeight(testContent);

      if (testHeight <= availableHeight) {
        // 当前内容能容纳，尝试更多字符
        maxFitIndex = mid;
        left = mid + 1;
      } else {
        // 内容太多，减少字符
        right = mid - 1;
      }
    }

    // 如果没有找到任何可容纳的内容（连一个字符都放不下），强制添加一个字符
    if (maxFitIndex === currentIndex) {
      maxFitIndex = currentIndex + 1;
    }

    // 在二分查找结果基础上，尝试精确调整（逐字符微调）
    // 向前尝试添加更多字符，直到真正超出边界
    while (maxFitIndex < cleanedText.length) {
      const testContent = cleanedText.slice(currentIndex, maxFitIndex + 1);
      const testHeight = measureParagraphsHeight(testContent);

      if (testHeight <= availableHeight) {
        maxFitIndex++;
      } else {
        break;
      }
    }

    // 保存这一页的内容
    const pageContent = cleanedText.slice(currentIndex, maxFitIndex);
    pagesData.push({ content: pageContent, type: 'content' });

    // 更新到下一页的起始位置
    currentIndex = maxFitIndex;
  }

  // 如果没有生成任何页面，至少添加一个包含全部内容的页面
  if (pagesData.length === 0) {
    pagesData.push({ content: cleanedText, type: 'content' });
  }

  // 添加评论页
  pagesData.push({ content: '', type: 'comments' });

  return {
    pages: pagesData,
    totalPages: pagesData.length,
    containerSize: { width: containerWidth, height: containerHeight },
    fontSettings
  };
};

/**
 * 计算水平翻页模式的进度百分比
 * @param {Array} pages - 分页数据数组
 * @param {number} currentPageIndex - 当前页索引
 * @returns {number} 进度百分比（0-100）
 */
export const getHorizontalProgressPercent = (pages, currentPageIndex) => {
  if (!pages || pages.length === 0) return 0;

  const contentPages = pages.filter(p => p?.type === 'content').length;
  if (contentPages <= 1) return 0;

  const currentIsComments = pages[currentPageIndex]?.type === 'comments';
  // 评论页不计入进度，按最后一页正文计算
  const effectiveIndex = currentIsComments
    ? contentPages - 1
    : Math.min(
        contentPages - 1,
        pages.slice(0, Math.min(currentPageIndex + 1, pages.length)).filter(p => p?.type === 'content').length - 1
      );

  const percent = (effectiveIndex / (contentPages - 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent * 100) / 100));
};
