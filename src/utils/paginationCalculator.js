/**
 * 分页计算模块（水平翻页）
 * 参考「高精度段落分页」：按换行分段并过滤空行 → 离屏 flow-root + <p> 段落 margin → 物理底线 + 二分截断
 */

/**
 * 按换行分段并移除空行（与参考 getCleanParagraphs 一致）
 * @param {string} text
 * @returns {string[]}
 */
export const splitIntoCleanParagraphs = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text.split('\n').map((line) => line.trim()).filter((p) => p.length > 0);
};

/**
 * 文本清理（滚动模式等仍可使用：压缩多余空行）
 * @param {string} text
 * @returns {string}
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/^\s+/, '')
    .replace(/\s+$/, '');
};

/**
 * 将 line-height 转为像素
 * @param {string|number} lh
 * @param {number} fontSize
 * @returns {number}
 */
export const getComputedLineHeightPx = (lh, fontSize) => {
  if (typeof lh === 'string' && lh.toLowerCase().endsWith('px')) {
    return parseFloat(lh);
  }
  const mult = parseFloat(lh);
  return !Number.isNaN(mult) ? mult * fontSize : fontSize * 1.5;
};

/**
 * @param {object} opts
 * @returns {{ measureBox: HTMLDivElement, textWrap: HTMLDivElement, targetBottom: number }}
 */
function createParagraphMeasureBox(opts) {
  const {
    width,
    height,
    fontSize,
    lineHeight,
    letterSpacing = 0,
    wordBreak = 'break-word',
    fontFamily,
    color,
    backgroundColor
  } = opts;

  const measureBox = document.createElement('div');
  measureBox.style.position = 'absolute';
  measureBox.style.top = '0px';
  measureBox.style.left = '-9999px';
  measureBox.style.width = `${width}px`;
  measureBox.style.height = `${height}px`;
  measureBox.style.boxSizing = 'border-box';
  measureBox.style.overflow = 'visible';

  const textWrap = document.createElement('div');
  textWrap.style.display = 'flow-root';
  textWrap.style.fontSize = `${fontSize}px`;
  textWrap.style.lineHeight = String(lineHeight);
  textWrap.style.letterSpacing = `${letterSpacing}px`;
  textWrap.style.wordBreak = wordBreak;
  textWrap.style.fontFamily = fontFamily;
  textWrap.style.color = color;
  textWrap.style.backgroundColor = backgroundColor;

  measureBox.appendChild(textWrap);
  document.body.appendChild(measureBox);

  const measureBoxRect = measureBox.getBoundingClientRect();
  const targetBottom = measureBoxRect.bottom;

  return { measureBox, textWrap, targetBottom };
}

/**
 * 段落级分页（参考 ai_studio_code 5.html paginateText）
 * @param {string[]} paragraphs
 * @param {object} options
 * @param {number} options.contentWidth
 * @param {number} options.heightFirstPage - 第一页正文区高度（已扣标题）
 * @param {number} options.heightOtherPages - 后续页正文区高度
 * @param {number} options.paragraphSpacing - 段落上下 margin（px），与参考 pMarginY 一致
 * @returns {string[][]} 每页为段落字符串数组
 */
export function paginateParagraphs(paragraphs, options) {
  const {
    contentWidth,
    heightFirstPage,
    heightOtherPages,
    paragraphSpacing,
    fontSize,
    lineHeight,
    letterSpacing = 0,
    wordBreak = 'break-word',
    fontFamily,
    color,
    backgroundColor
  } = options;

  const baseStyle = {
    width: contentWidth,
    fontSize,
    lineHeight,
    letterSpacing,
    wordBreak,
    fontFamily,
    color,
    backgroundColor
  };

  const getPageHeight = (pageIdx) => (pageIdx === 0 ? heightFirstPage : heightOtherPages);

  const pages = [[]];
  let currentPageIdx = 0;

  let measureBox = null;
  let textWrap = null;
  let targetBottom = 0;
  let measureBoxHeightUsed = null;

  const ensureMeasureBox = (pageIdx) => {
    const h = getPageHeight(pageIdx);
    if (measureBox && measureBoxHeightUsed === h) return;
    if (measureBox?.parentNode) {
      document.body.removeChild(measureBox);
    }
    const m = createParagraphMeasureBox({ ...baseStyle, height: h });
    measureBox = m.measureBox;
    textWrap = m.textWrap;
    targetBottom = m.targetBottom;
    measureBoxHeightUsed = h;
  };

  ensureMeasureBox(0);

  try {
    for (let i = 0; i < paragraphs.length; i++) {
      let remainingText = paragraphs[i];

      while (remainingText.length > 0) {
        ensureMeasureBox(currentPageIdx);

        const p = document.createElement('p');
        p.style.marginTop = `${paragraphSpacing}px`;
        p.style.marginBottom = `${paragraphSpacing}px`;
        p.textContent = remainingText;
        textWrap.appendChild(p);

        const pRect = p.getBoundingClientRect();

        if (pRect.bottom <= targetBottom + 0.5) {
          pages[currentPageIdx].push(remainingText);
          remainingText = '';
        } else {
          const chars = Array.from(remainingText);
          let low = 1;
          let high = chars.length;
          let splitIndex = 0;

          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            p.textContent = chars.slice(0, mid).join('');
            if (p.getBoundingClientRect().bottom <= targetBottom + 0.5) {
              splitIndex = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }

          if (splitIndex === 0) {
            if (pages[currentPageIdx].length === 0) {
              splitIndex = 1;
            } else {
              textWrap.removeChild(p);
              currentPageIdx += 1;
              pages[currentPageIdx] = [];
              textWrap.innerHTML = '';
              continue;
            }
          }

          pages[currentPageIdx].push(chars.slice(0, splitIndex).join(''));
          remainingText = chars.slice(splitIndex).join('');

          currentPageIdx += 1;
          pages[currentPageIdx] = [];
          textWrap.innerHTML = '';
        }
      }
    }
  } finally {
    if (measureBox?.parentNode) {
      document.body.removeChild(measureBox);
    }
  }

  if (pages.length > 0 && pages[pages.length - 1].length === 0) {
    pages.pop();
  }

  return pages;
}

/**
 * 计算文本分页（水平翻页）
 * @param {Object} params
 * @returns {Promise<Object>}
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
  const {
    fontFamily,
    fontSize,
    lineHeight,
    textColor,
    backgroundColor,
    letterSpacing = 0,
    wordBreak = 'break-word',
    paragraphSpacing = 12
  } = fontSettings;

  const horizontalPad = 16;
  const verticalPad = 16;
  const contentWidth = Math.max(1, containerWidth - horizontalPad * 2);
  const innerHeight = Math.max(1, containerHeight - verticalPad * 2);

  let titleHeight = providedTitleHeight ?? 0;
  if (providedTitleHeight == null && title) {
    const tempTitle = document.createElement('h1');
    tempTitle.textContent = title;
    tempTitle.className = 'text-2xl font-semibold mb-6 flex-shrink-0';
    tempTitle.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${contentWidth}px;
      font-family: ${fontFamily};
      color: ${textColor};
    `;
    document.body.appendChild(tempTitle);
    titleHeight = tempTitle.offsetHeight + 24;
    document.body.removeChild(tempTitle);
  }

  const heightFirstPage = Math.max(1, innerHeight - titleHeight);
  const heightOtherPages = innerHeight;

  const paragraphs = splitIntoCleanParagraphs(content);

  const pagesData = [];

  if (paragraphs.length === 0) {
    pagesData.push({ paragraphs: [], type: 'content' });
  } else {
    const pageParagraphs = paginateParagraphs(paragraphs, {
      contentWidth,
      heightFirstPage,
      heightOtherPages,
      paragraphSpacing,
      fontSize,
      lineHeight,
      letterSpacing,
      wordBreak,
      fontFamily,
      color: textColor,
      backgroundColor
    });

    for (const paras of pageParagraphs) {
      pagesData.push({ paragraphs: paras, type: 'content' });
    }
  }

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
 * @param {Array} pages
 * @param {number} currentPageIndex
 * @returns {number}
 */
export const getHorizontalProgressPercent = (pages, currentPageIndex) => {
  if (!pages || pages.length === 0) return 0;

  const contentPages = pages.filter(p => p?.type === 'content').length;
  if (contentPages <= 1) return 0;

  const currentIsComments = pages[currentPageIndex]?.type === 'comments';
  const effectiveIndex = currentIsComments
    ? contentPages - 1
    : Math.min(
      contentPages - 1,
      pages.slice(0, Math.min(currentPageIndex + 1, pages.length)).filter(p => p?.type === 'content').length - 1
    );

  const percent = (effectiveIndex / (contentPages - 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent * 100) / 100));
};
