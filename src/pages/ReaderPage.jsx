import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChapterById, updateReadingProgress, addReadingHistory, getNovelChapters, getNovelById, getReadingProgress, getReadingPaths, getUserCustomPath, getAuthorRecommendedPath, getRandomNextChapter, getReadingPathDetail, toggleChapterLike, checkChapterLikeStatus, getChapterLikeCount, reportChapter } from '../services/novelAPI';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../components/Modal';
import NovelEditView from '../components/NovelEditView';
import { getBookmarksByNovel, addBookmark, removeBookmark, checkBookmarkExists, getGlobalBookmarks, getOtherBookmarks } from '../services/novelAPI';
import ChapterComments from '../components/ChapterComments';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconHeart,
  IconHeartFilled,
  IconBookmark,
  IconBookmarkFilled,
  IconMessagePlus,
  IconFileText,
  IconArrowLeft,
  IconSun,
  IconMoon,
  IconPalette,
  IconRoute,
  IconHelp,
  IconUser,
  IconStar,
  IconNavigation,
  IconX,
  IconExclamationCircle,
  IconTrash
} from '@tabler/icons-react';

// 本地阅读设置键名
const SETTINGS_KEY_LIGHT = 'reader_settings_light';
const SETTINGS_KEY_DARK = 'reader_settings_dark';
const THEME_KEY = 'reader_theme';
const PAGINATION_MODE_KEY = 'reader_pagination_mode';

const defaultSettings = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  fontSize: 18,
  lineHeight: 1.8,
  backgroundColor: '#ffffff',
  textColor: '#1f2937'
};

const defaultDark = {
  fontFamily: defaultSettings.fontFamily,
  fontSize: 18,
  lineHeight: 1.8,
  backgroundColor: '#0e1516',
  textColor: '#e2e8f0'
};

const ReaderPage = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const modal = useModal();

  const [chapter, setChapter] = useState(null);
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'dark' : false;
  });
  const [settings, setSettings] = useState(() => {
    const key = localStorage.getItem(THEME_KEY) === 'dark' ? SETTINGS_KEY_DARK : SETTINGS_KEY_LIGHT;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return isDark ? defaultDark : defaultSettings;
  });
  const [bookmarkExists, setBookmarkExists] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [catalogMode, setCatalogMode] = useState('list'); // list | view
  const [viewCentered, setViewCentered] = useState(false); // 视图是否已居中
  const [branchChoices, setBranchChoices] = useState(null); // 分支选择弹窗
  const [settingsCollapsed, setSettingsCollapsed] = useState({
    common: false,
    font: true,
    color: true,
    readingPath: true,
    pagination: true,
    navigation: false,
    menu: true
  });
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [globalBookmarks, setGlobalBookmarks] = useState([]);
  const [otherBookmarks, setOtherBookmarks] = useState([]);


  const BookmarkList = ({ items, emptyText, onJump }) => {
    if (!items || items.length === 0) {
      return <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{emptyText}</div>;
    }
    return (
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`w-full px-3 py-2 rounded-lg border transition-colors flex items-center justify-between ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
            <button
              onClick={() => onJump(item.chapter_id, item.novel_id)}
              className="text-left flex-1 min-w-0"
            >
              <div className="font-medium text-sm truncate">{item.title || '未命名章节'}</div>
              <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.note || ''}</div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {!item.is_global && (
                <button
                  title="添加到全局书签"
                  className={`px-2 py-1 text-sm font-medium rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                  onClick={async () => {
                    const res = await addBookmark(item.chapter_id, item.note || null, true);
                    if (res && res.success) {
                      await loadBookmarks();
                    }
                  }}
                >
                  设为全局
                </button>
              )}
              <button
                title="删除书签"
                className={`p-1.5 rounded ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
onClick={() => {
                  modal.showConfirm({
                    type: 'warning',
                    title: '删除书签',
                    message: '确定要删除该书签吗？此操作不可撤销。',
                    darkMode: isDark,
                    onConfirm: async () => {
                      const res = await removeBookmark(item.chapter_id);
                      if (res && res.success) {
                        await loadBookmarks();
                      }
                    }
                  });
                }}
              >
                <IconTrash className="w-4 h-4" stroke={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 阅读线相关状态
  const [readingPaths, setReadingPaths] = useState([]);
  const [currentReadingPath, setCurrentReadingPath] = useState(null);
  const [readingMode, setReadingMode] = useState(() => {
    // 从localStorage读取保存的阅读模式，按小说ID分别保存
    const savedMode = localStorage.getItem(`reading_mode_${novelId}`);
    return savedMode || 'ask';
  }); // ask | custom | author_recommended | random

  // 章节互动相关状态
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // 翻页相关状态
  const [paginationMode, setPaginationMode] = useState(() => {
    const saved = localStorage.getItem(PAGINATION_MODE_KEY);
    if (saved) return saved;
    // 默认：移动端使用水平翻页，桌面端使用滚动
    return window.innerWidth <= 768 ? 'horizontal' : 'scroll';
  });
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const paginationWorkerRef = useRef(null);
  const lastHistoryMarkRef = useRef(0);
  const readingStartRef = useRef(null);
  const accumulatedReadingMsRef = useRef(0);
  const savedProgressRef = useRef(null);
  const progressFetchedRef = useRef(false); // 防止重复获取进度
  // 当前阅读进度百分比的持久引用（0-100），用于模式切换时快速还原
  const currentProgressPercentRef = useRef(0);

  // 文本清理函数 - 移除无意义的空行
  const cleanText = (text) => {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(/\n\s*\n\s*\n+/g, '\n\n')  // 将3个或更多连续空行替换为2个
      .replace(/\n\s*\n\s*\n+/g, '\n\n')  // 再次处理，确保没有更多连续空行
      .replace(/^\s+/, '')  // 移除开头空白
      .replace(/\s+$/, ''); // 移除结尾空白
  };

  // 翻页工具函数
  const splitTextIntoParagraphs = (text) => {
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

  const splitTextIntoSentences = (text) => {
    if (!text || typeof text !== 'string') return [];

    const sentences = text.split(/[。！？；.!?;]\s*/).filter(s => s.trim().length > 0);

    // 如果没有分割出句子，尝试按逗号分割
    if (sentences.length === 0) {
      return text.split(/[，,]\s*/).filter(s => s.trim().length > 0);
    }

    return sentences;
  };

  const isCalculatingRef = useRef(false);
  const calculatePagination = async () => {
    if (!chapter?.content) {
      return;
    }
    if (isCalculatingRef.current) return;
    isCalculatingRef.current = true;
    setPaginationLoading(true);

    // 在外层作用域声明变量
    let actualContentDiv = null;
    let originalContent = '';

    try {
      // 等待DOM渲染完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 使用容器ref或者计算窗口尺寸
      const container = containerRef.current || contentRef.current;
      if (!container) {
        console.error('分页计算失败：找不到容器元素');
        setPaginationLoading(false);
        return;
      }

      // 直接获取水平分页模式下的内容容器高度
      // 使用多种选择器尝试找到内容容器（仅针对水平翻页容器）
      let contentContainer = container.querySelector('.max-w-3xl.mx-auto.px-4.py-4.h-full.flex.flex-col');

      let availableContentHeight = 0;
      let containerWidth = 0;
      let titleHeight = 0;

      if (contentContainer && contentContainer.clientHeight > 0) {
        // 获取容器的实际高度和宽度
        availableContentHeight = contentContainer.clientHeight;
        containerWidth = contentContainer.clientWidth;

        // 创建临时标题元素测量高度（第一页需要）
        const tempTitle = document.createElement('h1');
        tempTitle.textContent = chapter.title;
        tempTitle.className = 'text-2xl font-semibold mb-6 flex-shrink-0';
        tempTitle.style.cssText = `
          position: absolute;
          top: -9999px;
          left: -9999px;
          width: ${containerWidth}px;
          font-family: ${settings.fontFamily};
          color: ${settings.textColor};
        `;
        document.body.appendChild(tempTitle);
        titleHeight = tempTitle.offsetHeight + 24; // 包含mb-6的24px
        document.body.removeChild(tempTitle);

        /* prod: no debug */
      } else {
        // 降级方案：如果找不到容器，使用计算方式
        /* prod: no debug */
        const totalHeight = window.innerHeight;
        const topBar = document.querySelector('.fixed.top-0');
        const topBarHeight = topBar ? topBar.offsetHeight : 40;
        const bottomBar = document.querySelector('.fixed.bottom-4.right-4');
        const bottomBarHeight = bottomBar ? bottomBar.offsetHeight + 16 : 30;
        const containerPadding = 32; // py-4 = 16px top + 16px bottom
        containerWidth = Math.min(window.innerWidth - 32, 768);

        // 计算标题高度
        const tempTitle = document.createElement('h1');
        tempTitle.textContent = chapter.title;
        tempTitle.className = 'text-2xl font-semibold mb-6 flex-shrink-0';
        tempTitle.style.cssText = `
          position: absolute;
          top: -9999px;
          left: -9999px;
          width: ${containerWidth}px;
          font-family: ${settings.fontFamily};
          color: ${settings.textColor};
        `;
        document.body.appendChild(tempTitle);
        titleHeight = tempTitle.offsetHeight + 24;
        document.body.removeChild(tempTitle);

        availableContentHeight = totalHeight - topBarHeight - bottomBarHeight - containerPadding;
      }

      // 计算第一页和其他页面的可用高度
      const availableHeightForFirstPage = availableContentHeight - titleHeight;
      const availableHeightForOtherPages = availableContentHeight;

      /* prod: no debug */

      if (availableHeightForOtherPages <= 0 || containerWidth <= 0) {
        throw new Error(`无效的容器尺寸: ${containerWidth}x${availableHeightForOtherPages}`);
      }

      // 创建模拟测试容器，但使用实际容器的尺寸
      const testContainer = document.createElement('div');
      testContainer.className = 'prose max-w-none';
      testContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: ${containerWidth}px;
        max-width: none;
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize}px;
        line-height: ${settings.lineHeight};
        color: ${settings.textColor};
        background-color: ${settings.backgroundColor};
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

      // 创建段落高度测量函数 - 使用测试容器但基于实际容器尺寸
      const measureParagraphsHeight = (text) => {
        if (!text.trim()) return 0;

        // 清空测试容器
        testContainer.innerHTML = '';

        // 将文本按行分割并过滤空行
        const lines = text.split('\n').filter(line => line.trim());

        // 为每个非空行创建p标签，与实际渲染完全一致
        lines.forEach((line, index) => {
          const p = document.createElement('p');
          p.className = 'mb-5 first:mt-0 last:mb-0';
          p.style.cssText = `
            text-indent: 2em;
            line-height: ${settings.lineHeight};
            font-size: ${settings.fontSize}px;
            font-family: ${settings.fontFamily};
            word-wrap: break-word;
            overflow-wrap: break-word;
          `;
          p.textContent = line;
          testContainer.appendChild(p);
        });

        return testContainer.scrollHeight;
      };

      // 预处理文本，清理多余的空行
      const cleanedText = cleanText(chapter.content);
      /* prod: no debug */

      // 使用更精确的字符级分页算法
      const allText = cleanedText;

      const pagesData = [];
      let currentIndex = 0;

      while (currentIndex < allText.length) {
        // 判断当前是否为第一页（需要为标题预留空间）
        const isFirstPage = pagesData.length === 0;
        const availableHeight = isFirstPage ? availableHeightForFirstPage : availableHeightForOtherPages;

        // 使用二分查找找到最精确的分页边界
        let left = currentIndex;
        let right = allText.length;
        let maxFitIndex = currentIndex;

        // 二分查找最大能容纳的字符数
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testContent = allText.slice(currentIndex, mid);
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
        while (maxFitIndex < allText.length) {
          const testContent = allText.slice(currentIndex, maxFitIndex + 1);
          const testHeight = measureParagraphsHeight(testContent);

          if (testHeight <= availableHeight) {
            maxFitIndex++;
          } else {
            break;
          }
        }

        // 保存这一页的内容
        const pageContent = allText.slice(currentIndex, maxFitIndex);
        pagesData.push({ content: pageContent, type: 'content' });

        // 验证实际高度
        const actualHeight = measureParagraphsHeight(pageContent);
        const paragraphCount = pageContent.split('\n').filter(line => line.trim()).length;

        // 更新到下一页的起始位置
        currentIndex = maxFitIndex;

        /* prod: no debug */
      }

      // 如果没有生成任何页面，至少添加一个包含全部内容的页面
      if (pagesData.length === 0) {
        pagesData.push({ content: allText, type: 'content' });
        /* prod: no debug */
      }

      // 输出每页的字符数和高度信息用于调试
      /* prod: no debug */
      pagesData.forEach((page, index) => {
        if (page.type === 'content') {
          const pageHeight = measureParagraphsHeight(page.content);
          const maxHeight = index === 0 ? availableHeightForFirstPage : availableHeightForOtherPages;
          const paragraphCount = page.content.split('\n').filter(line => line.trim()).length;
          /* prod: no debug */
        }
      });

      // 分页完成：标记初始化完成，实际页数还原交给 useEffect 处理
      horizontalInitializedRef.current = true;

      // 添加评论页
      pagesData.push({ content: '', type: 'comments' });

      // 清理测试容器和样式
      document.body.removeChild(testContainer);
      document.head.removeChild(style);

      setPages(pagesData);
      setTotalPages(pagesData.length);
      // 默认从第一页开始；若存在待恢复进度或当前进度>0，则交由后续还原逻辑处理
      const hasPendingRestore = pendingRestoreRef.current != null && pendingRestoreRef.current > 0;
      const hasKnownProgress = (currentProgressPercentRef.current || 0) > 0;
      if (!hasPendingRestore && !hasKnownProgress) {
        setCurrentPage(0);
      }
      // 将分页结果保存供顺序引导流程读取
      lastPagesDataRef.current = pagesData;
    } catch (error) {
      console.error('分页计算失败:', error);

      // 尝试清理可能创建的DOM元素
      try {
        const tempContainer = document.body.querySelector('[style*="position: absolute"][style*="top: -9999px"]');
        if (tempContainer) {
          document.body.removeChild(tempContainer);
        }
        const tempStyle = document.head.querySelector('style[data-pagination]');
        if (tempStyle) {
          document.head.removeChild(tempStyle);
        }
      } catch (cleanupError) { /* ignore */ }

      // 错误恢复：创建单页内容
      const fallbackPages = [
        { content: chapter.content, type: 'content' },
        { content: '', type: 'comments' }
      ];
      setPages(fallbackPages);
      setTotalPages(fallbackPages.length);
      const hasPendingRestore2 = pendingRestoreRef.current != null && pendingRestoreRef.current > 0;
      const hasKnownProgress2 = (currentProgressPercentRef.current || 0) > 0;
      if (!hasPendingRestore2 && !hasKnownProgress2) {
        setCurrentPage(0);
      }
    } finally {
      setPaginationLoading(false);
      isCalculatingRef.current = false;
    }
  };

  // 切换翻页模式
  const switchPaginationMode = (mode) => {
    // 优先使用当前进度引用，兜底即时计算一次
    let currentPercent = typeof currentProgressPercentRef.current === 'number'
      ? currentProgressPercentRef.current
      : 0;
    if (!currentPercent || Number.isNaN(currentPercent)) {
      try {
        if (paginationMode === 'horizontal') {
          currentPercent = getHorizontalProgressPercent();
        } else {
          const el = containerRef.current;
          const scrollTop = el ? el.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
          const scrollHeight = el ? el.scrollHeight : document.documentElement.scrollHeight;
          const clientHeight = el ? el.clientHeight : window.innerHeight;
          const denominator = Math.max(1, (scrollHeight - clientHeight));
          currentPercent = Math.min(100, Math.max(0, (scrollTop / denominator) * 100));
          currentPercent = Math.round(currentPercent * 100) / 100;
        }
      } catch {/* ignore */ }
    }

    // 暂存待恢复进度，并隐藏正文避免切换闪烁
    pendingRestoreRef.current = currentPercent;
    lastHistoryMarkRef.current = currentPercent;
    currentProgressPercentRef.current = currentPercent;
    setContentVisible(false);

    setPaginationMode(mode);
    localStorage.setItem(PAGINATION_MODE_KEY, mode);

    if (mode === 'horizontal') {
      // 水平翻页：分页计算与进度还原交由下方 effect 处理
    } else {
      // 滚动模式：保留分页结果，便于随时切回；等待容器就绪后按百分比恢复滚动位置
      const restoreScroll = (attempt = 0) => {
        const percent = pendingRestoreRef.current ?? 0;
        const el = containerRef.current;
        const ready = el && el.scrollHeight > el.clientHeight;
        if (ready) {
          const scrollHeight = el.scrollHeight;
          const clientHeight = el.clientHeight;
          const denominator = Math.max(1, (scrollHeight - clientHeight));
          const top = Math.round((percent / 100) * denominator);
          try { el.scrollTo({ top }); } catch { el.scrollTop = top; }
          setContentVisible(true);
          pendingRestoreRef.current = null;
        } else if (attempt < 10) {
          requestAnimationFrame(() => restoreScroll(attempt + 1));
        } else {
          // 兜底：使用窗口滚动
          const sh = document.documentElement.scrollHeight;
          const ch = window.innerHeight;
          const denom = Math.max(1, (sh - ch));
          const top = Math.round((percent / 100) * denom);
          try { window.scrollTo({ top }); } catch { document.documentElement.scrollTop = top; }
          setContentVisible(true);
          pendingRestoreRef.current = null;
        }
      };
      // 下一帧开始尝试，确保已完成模式切换渲染
      requestAnimationFrame(() => restoreScroll(0));
    }
  };

  // 翻页导航
  const goToPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages && pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      // 翻页模式：在用户触发翻页时上报进度
      if (paginationMode === 'horizontal' && isAuthenticated && pages && pages.length > 0) {
        const percent = getHorizontalProgressPercent();
        lastHistoryMarkRef.current = percent;
        currentProgressPercentRef.current = percent;
        updateReadingProgress(novelId, chapterId, percent, currentReadingPath?.id);
      }
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (prevChapterId) {
      // 第一页再向右翻：进入上一章的评论页
      try { sessionStorage.setItem(`restore_to_comments_${prevChapterId}`, '1'); } catch { }
      navigate(`/novel/${novelId}/read/${prevChapterId}`);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    } else if (pages[currentPage]?.type === 'comments') {
      // 评论页继续翻动：进入下一章
      handleNavigate('next');
    }
  };

  // 章节导航
  const handleNavigate = (direction) => {
    if (direction === 'prev' && prevChapterId) {
      navigate(`/novel/${novelId}/read/${prevChapterId}`);
    } else if (direction === 'next') {
      if (readingMode === 'random') {
        handleRandomNext();
      } else if (readingMode === 'custom' || readingMode === 'author_recommended') {
        const nextChapter = getNextChapterFromPath();
        if (nextChapter) {
          navigate(`/novel/${novelId}/read/${nextChapter}`);
        } else {
          // 阅读线结束或当前章节不在阅读线中，显示分支选择
          setBranchChoices(nextChapters);
        }
      } else {
        // 询问模式或其他模式，显示分支选择
        if (nextChapters.length === 1) {
          navigate(`/novel/${novelId}/read/${nextChapters[0].id}`);
        } else if (nextChapters.length > 1) {
          setBranchChoices(nextChapters);
        }
        // 如果没有下一章节，不执行任何操作
      }
    }
  };

  // 加载所有数据
  const loadAll = async () => {
    setLoading(true);
    setError('');
    setContentVisible(false);
    bootstrappingRef.current = true;
    try {
      // 顺序：章节 -> 小说 -> 章节列表
      const chapterResult = await getChapterById(novelId, chapterId);
      if (!chapterResult.success) {
        setError(chapterResult.message || '获取章节失败');
        return;
      }
      setChapter(chapterResult.chapter);

      const novelResult = await getNovelById(novelId);
      if (novelResult.success) setNovel(novelResult.novel);

      const chaptersResult = await getNovelChapters(novelId);
      if (chaptersResult.success) setChapters(chaptersResult.chapters);

      // 加载阅读线（顺序流程外，非阻塞）
      loadReadingPaths();

      // 点赞状态（非阻塞）
      loadChapterLikeStatus();

      // 若为水平翻页：后续在引导effect中顺序执行（渲染后）
      if (paginationMode !== 'horizontal') {
        // 滚动模式：直接显示（进度恢复在各自effect中完成滚动定位）
        setContentVisible(true);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('网络错误，请稍后重试');
      setContentVisible(true);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  // 加载章节点赞状态
  const loadChapterLikeStatus = async () => {
    try {


      const [likeStatusResult, likeCountResult] = await Promise.all([
        checkChapterLikeStatus(novelId, chapterId),
        getChapterLikeCount(novelId, chapterId)
      ]);




      if (likeStatusResult.success) {

        setIsLiked(likeStatusResult.isLiked);
      }

      if (likeCountResult.success) {

        setLikeCount(likeCountResult.count);
      }
    } catch (error) {
      console.error('加载点赞状态失败:', error);
    }
  };

  // 切换章节点赞状态
  const handleToggleChapterLike = async () => {
    if (!isAuthenticated) {
      modal.showWarning({
        title: '登录提示',
        message: '请先登录后再点赞',
        darkMode: isDark
      });
      return;
    }

    setLikeLoading(true);
    try {
      const result = await toggleChapterLike(novelId, chapterId);
      if (result.success) {
        setIsLiked(result.action === 'like');
        setLikeCount(prev => result.action === 'like' ? prev + 1 : prev - 1);
      } else {
        modal.showError({
          title: '操作失败',
          message: result.message || '操作失败，请稍后重试',
          darkMode: isDark
        });
      }
    } catch (error) {
      modal.showError({
        title: '网络错误',
        message: '网络连接失败，请检查网络后重试',
        darkMode: isDark
      });
    } finally {
      setLikeLoading(false);
    }
  };

  // 举报章节
  const handleReportChapter = async (reason, description) => {
    try {
      const result = await reportChapter(novelId, chapterId, reason, description);
      if (result.success) {
        modal.showSuccess({
          title: '举报成功',
          message: '举报提交成功，我们会尽快处理',
          darkMode: isDark
        });
      } else {
        modal.showError({
          title: '举报失败',
          message: result.message || '举报失败，请稍后重试',
          darkMode: isDark
        });
      }
    } catch (error) {
      modal.showError({
        title: '网络错误',
        message: '网络连接失败，请检查网络后重试',
        darkMode: isDark
      });
    }
  };

  useEffect(() => {
    // 重置点赞相关状态
    setIsLiked(false);
    setLikeCount(0);
    setLikeLoading(false);

    loadAll();
    loadBookmarks();
    // 重置进度获取标志
    progressFetchedRef.current = false;
  }, [novelId, chapterId]);

  // 根据小说类型自动设置目录模式
  useEffect(() => {
    if (novel && novel.novel_type) {
      // 传统小说默认使用列表模式，非传统小说默认使用视图模式
      const defaultMode = novel.novel_type === 'traditional' ? 'list' : 'view';
      setCatalogMode(defaultMode);

      // 重置视图居中状态，让视图可以重新居中
      setViewCentered(false);
    }
  }, [novel]);

  // 当目录模式切换时，重置视图居中状态
  useEffect(() => {
    setViewCentered(false);
  }, [catalogMode]);

  // 当当前章节变化时，重置视图居中状态
  useEffect(() => {
    setViewCentered(false);
  }, [chapterId]);

  // 当内容加载完成时，重新计算分页
  useEffect(() => {
    if (loading || !chapter) return;
    // 引导阶段：立即计算分页，不再延迟
    calculatePagination();
  }, [loading, chapter, paginationMode, settings.fontSize, settings.lineHeight, settings.fontFamily]);

  // 监听窗口大小变化，重新计算分页（两种模式都计算，便于随时切换）
  useEffect(() => {
    const handleResize = () => {
      if (chapter) {
        calculatePagination();
      }
    };

    const debounceResize = (() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, 300);
      };
    })();

    window.addEventListener('resize', debounceResize);
    return () => {
      window.removeEventListener('resize', debounceResize);
    };
  }, [paginationMode, chapter]);

  // 监听键盘事件，支持方向键翻页
  useEffect(() => {
    if (paginationMode !== 'horizontal') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ': // 空格键
          e.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(0);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [paginationMode, currentPage, totalPages]);

  useEffect(() => {
    // 保存主题和设置
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    localStorage.setItem(isDark ? SETTINGS_KEY_DARK : SETTINGS_KEY_LIGHT, JSON.stringify(settings));
  }, [isDark, settings]);

  useEffect(() => {
    // 初次加载后，若已登录则检查书签与更新历史/进度
    if (!loading && chapter && isAuthenticated) {
      // 书签存在性
      checkBookmarkExists(chapter.id).then(res => {
        if (res && res.success) setBookmarkExists(!!res.exists);
      });

      // 记录历史（仅记录读过）
      // reading_duration 将在卸载或切章时更新，这里先打点
      addReadingHistory(novelId, chapter.id, 0);

      // 不在这里初始化进度，让进度恢复逻辑来处理
      // 如果没有保存的进度，进度恢复逻辑会保持在0%，无需额外上报
    }
  }, [loading, chapter, isAuthenticated, novelId]);

  useEffect(() => {
    // 进度上报：滚动模式用滚动，翻页模式用页数
    if (!isAuthenticated || !chapter) return;



    let debounceTimer = null;
    const reportProgress = () => {
      // 使用 window 的滚动信息，因为页面是整体滚动的
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      const denominator = Math.max(1, (scrollHeight - clientHeight));
      const progress = Math.min(100, Math.max(0, (scrollTop / denominator) * 100));
      // 实时更新当前进度引用
      currentProgressPercentRef.current = Math.round(progress * 100) / 100;

      // 只有进度变化超过1%时才上报，避免频繁上报
      if (Math.abs(progress - lastHistoryMarkRef.current) >= 1.0) {
        lastHistoryMarkRef.current = progress;
        updateReadingProgress(novelId, chapterId, Math.round(progress * 100) / 100, currentReadingPath?.id);
      }
    };

    const onScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reportProgress();
      }, 300); // 增加防抖时间减少请求频率
    };

    // 水平翻页：不在页面加载阶段自动上报，改为仅翻页动作时上报
    if (paginationMode === 'horizontal') {
      return; // 不挂载滚动监听
    }

    // 滚动模式：监听 window 的滚动事件
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [novelId, chapterId, isAuthenticated, chapter, paginationMode, currentPage, pages]); // 翻页模式依赖页变化

  // 加载保存的进度并在内容渲染后滚动到对应位置
  useEffect(() => {
    // 只在内容加载完成且用户已认证时执行，并且未获取过进度
    if (!chapter || !isAuthenticated || loading || progressFetchedRef.current) return;
    let cancelled = false;

    progressFetchedRef.current = true; // 标记已获取，防止重复

    const fetchAndScroll = async () => {
      try {
        const res = await getReadingProgress(novelId);
        if (cancelled) return;

        // 确保正确解析进度百分比（可能是字符串）
        let percent = 0;
        if (res && res.success && res.progress && res.progress.current_chapter_id === chapter.id) {
          const progressStr = res.progress.progress_percentage;
          percent = parseFloat(progressStr) || 0;
        }

        savedProgressRef.current = percent;

        // 记录当前进度用于后续对比
        lastHistoryMarkRef.current = percent;
        currentProgressPercentRef.current = percent;

        // 如果有保存的进度且大于0，则立即滚动到对应位置
        if (percent > 0) {
          setContentVisible(false);
          if (paginationMode === 'horizontal') {
            // 暂存目标页，等待分页完成后再跳转
            pendingRestoreRef.current = percent;
            console.log('翻页模式：暂存待恢复进度', percent + '%');
          } else {
            // 滚动模式恢复
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            const denominator = Math.max(1, (scrollHeight - clientHeight));
            const top = Math.round((percent / 100) * denominator);
            try {
              // 使用瞬时定位，避免等待平滑滚动导致正文长时间不可见
              window.scrollTo({ top });
            } catch {
              document.documentElement.scrollTop = top;
            }
          }
        } else {
          // 如果是新章节（无进度记录），则初始化为0%
          if (!res || !res.success || !res.progress) {
            updateReadingProgress(novelId, chapterId, 0, currentReadingPath?.id);
          }
          currentProgressPercentRef.current = 0;
          setContentVisible(true);
        }
      } catch (error) {
        // 忽略获取进度失败的错误
      }
    };

    // 内容渲染完成后（下一tick）再执行，保证容器尺寸已就绪
    const run = setTimeout(async () => {
      await fetchAndScroll();
      // 滚动定位完成后显示正文
      setContentVisible(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(run);
    };
  }, [chapter?.id, novelId, isAuthenticated, paginationMode, loading]);

  // 翻页模式：等待分页完成后执行进度恢复
  useEffect(() => {
    if (paginationMode !== 'horizontal') return;
    if (loading || !chapter) return;
    if (pages.length === 0) return; // 等待分页完成

    // 水平翻页模式：分页完成后执行进度恢复
    (async () => {
      try {
        // 总是尝试从后端获取最新进度
        let percent = 0;
        if (isAuthenticated) {
          try {
            const res = await getReadingProgress(novelId);
            if (res && res.success && res.progress && res.progress.current_chapter_id === chapter.id) {
              percent = parseFloat(res.progress.progress_percentage) || 0;
            } else {
              percent = 0;
            }
          } catch {
            percent = 0;
          }
        } else {
          // 未登录时使用本地缓存
          percent = pendingRestoreRef.current || currentProgressPercentRef.current || 0;
        }

        let nextPageIndex = 0;
        // 直接使用 pages 状态，因为此时分页已完成
        const currentPages = pages;

        if ((percent ?? 0) > 0 && currentPages && currentPages.length > 0) {
          const contentPages = currentPages.filter(p => p?.type === 'content').length;
          if (contentPages > 1) {
            const targetIndex = Math.round((percent / 100) * (contentPages - 1));
            let seen = -1;
            for (let i = 0; i < currentPages.length; i++) {
              if (currentPages[i]?.type === 'content') {
                seen++;
                if (seen === targetIndex) {
                  nextPageIndex = i;
                  break;
                }
              }
            }
          }
        }
        setCurrentPage(nextPageIndex);

        // 更新本地进度标记并清理暂存
        lastHistoryMarkRef.current = percent ?? 0;
        currentProgressPercentRef.current = percent ?? 0;
        pendingRestoreRef.current = null;

        // 若带着"进入评论页"标志进入该章节，则直接定位到评论页
        try {
          if (pages && pages.length > 0) {
            const flag = sessionStorage.getItem(`restore_to_comments_${chapter.id}`);
            if (flag === '1') {
              const commentsIndex = pages.findIndex(p => p?.type === 'comments');
              if (commentsIndex >= 0) setCurrentPage(commentsIndex);
              sessionStorage.removeItem(`restore_to_comments_${chapter.id}`);
            }
          }
        } catch { }
      } finally {
        setContentVisible(true);
      }
    })();
  }, [paginationMode, loading, chapter, pages, isAuthenticated]);

  // 若带着"进入评论页"标志进入某章节：在分页结果就绪后跳转到评论页
  useEffect(() => {
    if (!chapter || !chapter.id) return;
    if (!pages || pages.length === 0) return;
    try {
      const flag = sessionStorage.getItem(`restore_to_comments_${chapter.id}`);
      if (flag === '1') {
        const commentsIndex = pages.findIndex(p => p?.type === 'comments');
        if (commentsIndex >= 0) {
          setCurrentPage(commentsIndex);
        }
        sessionStorage.removeItem(`restore_to_comments_${chapter.id}`);
      }
    } catch { }
  }, [chapter?.id, pages]);

  // 统计阅读时长：仅页面可见时计时；上报单位：分钟（>=1 分钟才上报）
  useEffect(() => {
    let timer;
    const onVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden) {
        if (readingStartRef.current) {
          accumulatedReadingMsRef.current += (now - readingStartRef.current);
          readingStartRef.current = null;
        }
      } else {
        readingStartRef.current = now;
      }
    };

    // 初始化开始时间
    readingStartRef.current = Date.now();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      // 结束计时
      const now = Date.now();
      if (readingStartRef.current) {
        accumulatedReadingMsRef.current += (now - readingStartRef.current);
        readingStartRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      // 在卸载或切章时上报阅读时长（分钟，至少满1分钟才上报）
      if (chapter && isAuthenticated) {
        const minutes = Math.floor(Math.max(0, accumulatedReadingMsRef.current) / 60000);
        if (minutes >= 1) {
          try { addReadingHistory(novelId, chapter.id, minutes); } catch { }
        }
        accumulatedReadingMsRef.current = 0;
      }
    };
  }, [chapterId, novelId, isAuthenticated, chapter]);

  // 加载阅读线数据
  const loadReadingPaths = async () => {
    if (!isAuthenticated) return;

    try {
      const pathsResult = await getReadingPaths(novelId);
      if (pathsResult.success) {
        setReadingPaths(pathsResult.readingPaths || []);

        // 尝试从localStorage恢复之前保存的阅读模式和阅读线
        const savedMode = localStorage.getItem(`reading_mode_${novelId}`);
        const savedPathId = localStorage.getItem(`reading_path_${novelId}`);

        if (savedMode) {
          // 如果有保存的模式，尝试恢复
          if (savedMode === 'custom') {
            const customPath = pathsResult.readingPaths.find(p => p.path_type === 'custom' && p.is_mine);
            if (customPath) {
              // 加载完整的阅读线详情
              const pathDetail = await getReadingPathDetail(novelId, customPath.id);
              if (pathDetail.success) {
                setCurrentReadingPath(pathDetail.readingPath);
                setReadingMode('custom');
                return;
              }
            }
          } else if (savedMode === 'author_recommended') {
            const authorPath = pathsResult.readingPaths.find(p => p.path_type === 'author_recommended' && p.is_default);
            if (authorPath) {
              // 加载完整的阅读线详情
              const pathDetail = await getReadingPathDetail(novelId, authorPath.id);
              if (pathDetail.success) {
                setCurrentReadingPath(pathDetail.readingPath);
                setReadingMode('author_recommended');
                return;
              }
            }
          } else if (savedMode === 'random') {
            // 随机模式不需要阅读线
            setCurrentReadingPath(null);
            setReadingMode('random');
            return;
          } else if (savedMode === 'ask') {
            setCurrentReadingPath(null);
            setReadingMode('ask');
            return;
          }
        }

        // 如果没有保存的模式或恢复失败，使用默认优先级：自定义 -> 作者推荐 -> 询问
        const customPath = pathsResult.readingPaths.find(p => p.path_type === 'custom' && p.is_mine);
        const authorPath = pathsResult.readingPaths.find(p => p.path_type === 'author_recommended' && p.is_default);

        if (customPath) {
          // 加载完整的阅读线详情
          const pathDetail = await getReadingPathDetail(novelId, customPath.id);
          if (pathDetail.success) {
            setCurrentReadingPath(pathDetail.readingPath);
            setReadingMode('custom');
            localStorage.setItem(`reading_mode_${novelId}`, 'custom');
          }
        } else if (authorPath) {
          // 加载完整的阅读线详情
          const pathDetail = await getReadingPathDetail(novelId, authorPath.id);
          if (pathDetail.success) {
            setCurrentReadingPath(pathDetail.readingPath);
            setReadingMode('author_recommended');
            localStorage.setItem(`reading_mode_${novelId}`, 'author_recommended');
          }
        } else {
          setCurrentReadingPath(null);
          setReadingMode('ask');
          localStorage.setItem(`reading_mode_${novelId}`, 'ask');
        }
      }
    } catch (error) {
      console.error('加载阅读线失败:', error);
    }
  };

  const toggleMenu = () => setMenuVisible(v => !v);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const key = next ? SETTINGS_KEY_DARK : SETTINGS_KEY_LIGHT;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { setSettings(next ? defaultDark : defaultSettings); }
    } else {
      setSettings(next ? defaultDark : defaultSettings);
    }
  };

  const applySetting = (partial) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const loadBookmarks = async () => {
    try {
      const listRes = await getBookmarksByNovel(novelId);
      if (listRes && listRes.success) setBookmarks(listRes.bookmarks || []);
      const globalRes = await getGlobalBookmarks();
      if (globalRes && globalRes.success) setGlobalBookmarks(globalRes.bookmarks || []);
      const othersRes = await getOtherBookmarks(novelId);
      if (othersRes && othersRes.success) setOtherBookmarks(othersRes.bookmarks || []);
    } catch (e) { }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated || !chapter) return;
    if (bookmarkExists) {
      const res = await removeBookmark(chapter.id);
      if (res && res.success) {
        setBookmarkExists(false);
        await loadBookmarks();
      }
    } else {
      const res = await addBookmark(chapter.id, null, true);
      if (res && res.success) {
        setBookmarkExists(true);
        await loadBookmarks();
      }
    }
  };

  // 切换阅读模式
  const switchReadingMode = async (mode, path = null) => {
    setReadingMode(mode);

    // 如果有阅读线且需要详细信息，加载完整详情
    if (path && (mode === 'custom' || mode === 'author_recommended')) {
      try {
        const pathDetail = await getReadingPathDetail(novelId, path.id);
        if (pathDetail.success) {
          setCurrentReadingPath(pathDetail.readingPath);
        } else {
          setCurrentReadingPath(path); // 回退到基本信息
        }
      } catch (error) {
        console.error('加载阅读线详情失败:', error);
        setCurrentReadingPath(path); // 回退到基本信息
      }
    } else {
      setCurrentReadingPath(path);
    }

    // 保存阅读模式到localStorage，按小说ID分别保存
    localStorage.setItem(`reading_mode_${novelId}`, mode);
    // 如果有阅读线，也保存阅读线ID
    if (path) {
      localStorage.setItem(`reading_path_${novelId}`, path.id);
    } else {
      localStorage.removeItem(`reading_path_${novelId}`);
    }
  };

  // 根据当前阅读线获取下一章
  const getNextChapterFromPath = () => {
    if (!currentReadingPath || !chapter) return null;

    // 从阅读线的章节列表中找到当前章节的位置
    const currentIndex = currentReadingPath.chapters?.findIndex(ch => ch.chapter_id === chapter.id);

    if (currentIndex === -1 || currentIndex === undefined) {
      // 当前章节不在阅读线中，返回null
      return null;
    }

    // 获取下一章
    const nextChapterInPath = currentReadingPath.chapters[currentIndex + 1];
    return nextChapterInPath?.chapter_id || null;
  };

  // 获取随机下一章节
  const handleRandomNext = async () => {
    try {
      const result = await getRandomNextChapter(novelId, chapter?.id);
      if (result.success && result.chapter) {
        navigate(`/novel/${novelId}/read/${result.chapter.id}`);
      } else {
        // 如果没有随机章节，显示分支选择
        setBranchChoices(nextChapters);
      }
    } catch (error) {
      console.error('获取随机章节失败:', error);
      // 降级到分支选择
      setBranchChoices(nextChapters);
    }
  };



  const readerStyle = useMemo(() => ({
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    backgroundColor: settings.backgroundColor,
    color: settings.textColor
  }), [settings]);

  const menuCardClasses = isDark
    ? 'text-slate-100'
    : 'bg-white/95 text-slate-800 border-slate-200';
  const btnGhostClasses = isDark
    ? 'text-slate-100'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';
  const drawerBg = isDark ? 'text-slate-100' : 'bg-white text-slate-800 border-slate-200';
  const overlayBg = isDark ? 'bg-black/60' : 'bg-black/40';
  const menuCardStyle = isDark ? { backgroundColor: 'rgba(14, 21, 22, 0.9)', borderColor: '#1a2223' } : {};
  const btnGhostStyle = isDark ? { backgroundColor: '#1a2223' } : {};
  const drawerStyle = isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {};

  // 上一章/下一章定位辅助
  const chapterIndex = useMemo(() => chapters.findIndex(c => c.id === chapter?.id), [chapters, chapter]);
  const prevChapterId = useMemo(() => {
    // 上一章应该是当前章节的父章节
    if (!chapter || !chapter.parent_chapter_id) return null;
    return chapter.parent_chapter_id;
  }, [chapter]);
  const getNextChapters = () => {
    if (!chapter) return [];
    // 下一章只能是当前章节的直接子章节
    // 如果没有子章节，说明这条路径已经结束
    const directChildren = chapters.filter(c => c.parent_chapter_id === chapter.id);
    return directChildren;
  };
  const nextChapters = getNextChapters();

  // 基于正文内容计算字数（去除所有空白字符）
  const contentWordCount = useMemo(() => {
    if (!chapter || !chapter.content) return undefined;
    try {
      return chapter.content.replace(/\s/g, '').length;
    } catch {
      return undefined;
    }
  }, [chapter]);

  // 翻页模式进度控制
  const pendingRestoreRef = useRef(null); // 待恢复的目标页（基于pages索引）
  const horizontalInitializedRef = useRef(false); // 初始化完成后才上报进度
  const [contentVisible, setContentVisible] = useState(false); // 正文是否可见（等待进度还原时隐藏）
  const bootstrappingRef = useRef(false); // 顺序引导流程中
  const lastPagesDataRef = useRef([]); // 最近一次分页的结果

  // 水平翻页：层叠滑动相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0); // 当前拖拽位移（像素）
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const didDragRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const animationDirectionRef = useRef(null); // 'next' | 'prev'

  // 进入新章节时立即重置分页状态，避免残留出现"旧总页数/页码"闪烁
  useEffect(() => {
    // 清空分页计算中的标志与数据
    setPaginationLoading(true);
    setPages([]);
    setTotalPages(0);
    setCurrentPage(0); // 显示为第 1 页
    // 清理翻页模式的缓存引用
    pendingRestoreRef.current = null;
    lastPagesDataRef.current = [];
    // 隐藏正文，等待新章节进度还原/分页计算完再显示
    setContentVisible(false);
    // 重置拖拽与动画状态
    setIsDragging(false);
    setDragX(0);
  }, [novelId, chapterId]);

  const getContainerWidth = () => {
    const el = contentRef.current;
    return (el && el.clientWidth) ? el.clientWidth : window.innerWidth || 1;
  };

  // 将页索引映射为百分比（仅正文页参与进度）
  const getHorizontalProgressPercent = useMemo(() => {
    return () => {
      if (!pages || pages.length === 0) return 0;
      const contentPages = pages.filter(p => p?.type === 'content').length;
      if (contentPages <= 1) return 0;
      const currentIsComments = pages[currentPage]?.type === 'comments';
      // 评论页不计入进度，按最后一页正文计算
      const effectiveIndex = currentIsComments
        ? contentPages - 1
        : Math.min(
          contentPages - 1,
          pages.slice(0, Math.min(currentPage + 1, pages.length)).filter(p => p?.type === 'content').length - 1
        );
      const percent = (effectiveIndex / (contentPages - 1)) * 100;
      return Math.max(0, Math.min(100, Math.round(percent * 100) / 100));
    };
  }, [pages, currentPage]);

  if (initializing && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-slate-600 mb-4">{error || '章节不存在'}</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">返回</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
      {/* 顶部信息条 */}
      <div className={`fixed top-0 left-0 right-0 z-40 ${isDark ? 'text-slate-100' : 'bg-white text-slate-800 border-slate-200'} border-b`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-8 sm:h-10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-medium truncate" title={`${novel?.title || ''} · ${chapter.title}`}>{novel?.title || '书籍'} · {chapter.title}</div>
            </div>
            {/* 桌面端直接展示附加信息 */}
            <div className="hidden sm:flex items-center gap-3 flex-none text-xs">
              {chapter.author_username && (
                <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`} title="作者">
                  作者：
                  {chapter.author_id ? (
                    <Link 
                      to={`/profile/${chapter.author_id}`}
                      className={`${isDark ? 'text-slate-200' : 'text-slate-800'} hover:underline`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {chapter.author_username}
                    </Link>
                  ) : (
                    chapter.author_username
                  )}
                  {chapter.author_username !== novel?.author_username && (
                    <div className="relative inline-block ml-1 group">
                      <IconExclamationCircle
                        className="w-3 h-3 text-amber-500 cursor-help"
                        stroke={1.8}
                      />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        此章节由其他用户创作，非小说创建者 {novel?.author_username}
                      </div>
                    </div>
                  )}
                </span>
              )}
              {chapter.updated_at && (
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`} title="发布时间">发布时间：{new Date(chapter.updated_at).toLocaleString()}</span>
              )}
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`} title="进度">进度：{(chapterIndex + 1) || '-'} / {chapters.length || '-'}</span>
              {typeof contentWordCount === 'number' && (
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`} title="字数">字数：{contentWordCount}</span>
              )}
            </div>
            {/* 移动端展开按钮 */}
            <button
              className={`sm:hidden flex items-center px-2 py-0.5 text-[11px] rounded-md ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
              style={isDark ? { backgroundColor: '#1a2223' } : { backgroundColor: 'rgba(148,163,184,0.15)' }}
              onClick={() => setInfoExpanded(v => !v)}
              aria-label="更多信息"
            >
              详情
            </button>
          </div>
          {/* 移动端展开区 */}
          {infoExpanded && (
            <div className="sm:hidden pb-2 -mt-1">
              <div className={`grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {chapter.author_username && (
                  <div title="作者">
                    作者：
                    {chapter.author_id ? (
                      <Link 
                        to={`/profile/${chapter.author_id}`}
                        className={`${isDark ? 'text-slate-200' : 'text-slate-800'} hover:underline`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chapter.author_username}
                      </Link>
                    ) : (
                      chapter.author_username
                    )}
                    {chapter.author_username !== novel?.author_username && (
                      <div className="relative inline-block ml-1 group">
                        <IconExclamationCircle
                          className="w-3 h-3 text-amber-500 cursor-help"
                          stroke={1.8}
                        />
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          此章节由其他用户创作，非小说创建者 {novel?.author_username}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {chapter.updated_at && (
                  <div className="truncate col-span-2" title="发布时间">发布时间：{new Date(chapter.updated_at).toLocaleString()}</div>
                )}
                <div className="truncate" title="进度">进度：{(chapterIndex + 1) || '-'} / {chapters.length || '-'}</div>
                {typeof contentWordCount === 'number' && (
                  <div className="truncate" title="字数">字数：{contentWordCount}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 阅读内容区 */}
      {paginationMode === 'scroll' ? (
        // 滚动模式
        <div
          ref={containerRef}
          className={`min-h-screen overflow-y-auto pt-8 sm:pt-10`}
          style={readerStyle}
        >
          <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className={`text-2xl font-semibold mb-6 transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} style={{ color: settings.textColor }}>{chapter.title}</h1>
            <div
              className={`prose max-w-none pb-10 transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'} ${isDark ? 'prose-invert' : ''}`}
              style={{ color: settings.textColor }}
              onClick={(e) => {
                const { clientX, currentTarget } = e;
                const { width, left } = currentTarget.getBoundingClientRect();
                const x = clientX - left;
                const third = width / 3;
                if (x > third && x < 2 * third) {
                  toggleMenu();
                }
              }}
            >
              {cleanText(chapter.content)
                .split('\n')
                .map((line, index) => {
                  // 空白行不创建p标签
                  if (!line.trim()) {
                    return null;
                  }
                  return (
                    <p
                      key={index}
                      className="mb-5 first:mt-0 last:mb-0"
                      style={{
                        textIndent: '2em',
                        lineHeight: settings.lineHeight,
                        fontSize: settings.fontSize,
                        fontFamily: settings.fontFamily,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {line}
                    </p>
                  );
                })
                .filter(Boolean)}
            </div>

            {/* 评论区 */}
            <div className="mt-2 pt-10 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              {/* 评论区标题和互动按钮 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>评论区</h3>

                {/* 点赞和举报按钮 - 右上角 */}
                <div className="flex items-center space-x-2">
                  {/* 点赞按钮 */}
                  <button
                    onClick={handleToggleChapterLike}
                    disabled={likeLoading}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors whitespace-nowrap ${isLiked
                      ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-300'
                      : (isDark ? 'border-slate-600 text-slate-300 hover:border-slate-500' : 'border-slate-200 text-slate-600 hover:border-slate-300')
                      } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={isLiked ? {} : (isDark ? { backgroundColor: '#191c1f' } : { backgroundColor: 'white' })}
                  >
                    {isLiked ? (
                      <IconHeartFilled className="w-4 h-4" />
                    ) : (
                      <IconHeart className="w-4 h-4" stroke={1.8} />
                    )}
                    <span className="font-medium">
                      {likeLoading ? '处理中' : isLiked ? '已赞' : '点赞'}
                    </span>
                    <span className="text-xs opacity-75">({likeCount})</span>
                  </button>

                  {/* 下一章按钮（滚动模式尾部） */}
                  <button
                    onClick={() => handleNavigate('next')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors whitespace-nowrap ${isDark
                      ? 'border-slate-600 text-slate-300 hover:border-slate-500'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    style={isDark ? { backgroundColor: '#191c1f' } : { backgroundColor: 'white' }}
                    title="下一章"
                  >
                    <IconChevronRight className="w-4 h-4" stroke={1.8} />
                    <span>下一章</span>
                  </button>

                  {/* 举报按钮 */}
                  <button
                    onClick={() => {
                      modal.showForm({
                        title: '举报章节',
                        darkMode: isDark,
                        confirmText: '提交举报',
                        cancelText: '取消',
                        children: (
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                举报原因 *
                              </label>
                              <select
                                name="reason"
                                className={`w-full p-2 border rounded-md ${
                                  isDark 
                                    ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                }`}
                                required
                              >
                                <option value="">请选择原因</option>
                                <option value="违法违规">违法违规</option>
                                <option value="色情低俗">色情低俗</option>
                                <option value="广告垃圾">广告垃圾</option>
                                <option value="恶意骚扰">恶意骚扰</option>
                                <option value="侵犯版权">侵犯版权</option>
                                <option value="其他">其他</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                详细描述
                              </label>
                              <textarea
                                name="description"
                                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${
                                  isDark 
                                    ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                }`}
                                rows="3"
                                placeholder="请描述具体问题..."
                                maxLength="500"
                              />
                            </div>
                          </div>
                        ),
                        onConfirm: (formElement) => {
                          const formData = new FormData(formElement);
                          const reason = formData.get('reason');
                          const description = formData.get('description');
                          if (!reason) {
                            modal.showWarning({
                              title: '请选择举报原因',
                              message: '请先选择一个举报原因',
                              darkMode: isDark
                            });
                            return false;
                          }
                          handleReportChapter(reason, description);
                          return true;
                        }
                      });
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${isDark
                      ? 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600'
                      }`}
                    style={isDark ? { backgroundColor: '#191c1f' } : { backgroundColor: 'white' }}
                  >
                    <IconMessagePlus className="w-4 h-4" stroke={1.8} />
                    <span>举报</span>
                  </button>
                </div>
              </div>

              {/* 评论区内容 */}
              <ChapterComments novelId={novelId} chapterId={chapterId} isDark={isDark} />
            </div>

            <div className="h-24" />
          </div>
        </div>
      ) : (
        // 水平翻页模式
        <div
          ref={containerRef}
          className={`min-h-screen pt-8 sm:pt-10 overflow-hidden`}
          style={readerStyle}
        >
          <div className="h-full relative">
            {paginationLoading ? (
              // 分页计算中
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>正在计算分页...</div>
                </div>
              </div>
            ) : totalPages > 0 ? (
              // 分页内容
              <div
                ref={contentRef}
                className="h-full relative"
                style={{ height: 'calc(100vh - 2rem - 2.5rem)', touchAction: 'pan-y' }}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  dragStartXRef.current = t.clientX;
                  dragStartYRef.current = t.clientY;
                  setIsDragging(true);
                  didDragRef.current = false;
                }}
                onTouchMove={(e) => {
                  if (!isDragging) return;
                  const t = e.touches[0];
                  const dx = t.clientX - dragStartXRef.current;
                  const dy = t.clientY - dragStartYRef.current;
                  if (Math.abs(dx) > Math.abs(dy)) {
                    if (e.cancelable) e.preventDefault();
                    didDragRef.current = true;
                    const width = getContainerWidth();
                    let nextX = dx;
                    // 边界限制（评论页允许继续右滑进入下一章；第一页若有上一章，允许右滑）
                    if (dx < 0 && currentPage >= totalPages - 1 && pages[currentPage]?.type !== 'comments') nextX = 0;
                    if (dx > 0 && currentPage <= 0 && !prevChapterId) nextX = 0;
                    nextX = Math.max(-width, Math.min(width, nextX));
                    setDragX(nextX);
                  }
                }}
                onTouchEnd={() => {
                  if (!isDragging) return;
                  const width = getContainerWidth();
                  const threshold = Math.max(40, width * 0.2);
                  const dx = dragX;
                  setIsDragging(false);
                  if (dx < -threshold && (currentPage < totalPages - 1 || pages[currentPage]?.type === 'comments')) {
                    // 动画到下一页
                    animationDirectionRef.current = 'next';
                    isAnimatingRef.current = true;
                    setDragX(-width);
                    setTimeout(() => {
                      isAnimatingRef.current = false;
                      animationDirectionRef.current = null;
                      setDragX(0);
                      goToNextPage();
                    }, 250);
                  } else if (dx > threshold && (currentPage > 0 || (currentPage === 0 && prevChapterId))) {
                    // 动画到上一页（上一页从左侧滑入覆盖）
                    animationDirectionRef.current = 'prev';
                    isAnimatingRef.current = true;
                    setDragX(width);
                    setTimeout(() => {
                      isAnimatingRef.current = false;
                      animationDirectionRef.current = null;
                      setDragX(0);
                      goToPreviousPage();
                    }, 250);
                  } else {
                    // 回弹
                    setDragX(0);
                  }
                }}
                onMouseDown={(e) => {
                  dragStartXRef.current = e.clientX;
                  dragStartYRef.current = e.clientY;
                  setIsDragging(true);
                  didDragRef.current = false;
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  const dx = e.clientX - dragStartXRef.current;
                  const dy = e.clientY - dragStartYRef.current;
                  if (Math.abs(dx) > Math.abs(dy)) {
                    didDragRef.current = true;
                    const width = getContainerWidth();
                    let nextX = dx;
                    if (dx < 0 && currentPage >= totalPages - 1 && pages[currentPage]?.type !== 'comments') nextX = 0;
                    if (dx > 0 && currentPage <= 0 && !prevChapterId) nextX = 0;
                    nextX = Math.max(-width, Math.min(width, nextX));
                    setDragX(nextX);
                  }
                }}
                onMouseUp={() => {
                  if (!isDragging) return;
                  const width = getContainerWidth();
                  const threshold = Math.max(40, width * 0.2);
                  const dx = dragX;
                  setIsDragging(false);
                  if (dx < -threshold && (currentPage < totalPages - 1 || pages[currentPage]?.type === 'comments')) {
                    animationDirectionRef.current = 'next';
                    isAnimatingRef.current = true;
                    setDragX(-width);
                    setTimeout(() => {
                      isAnimatingRef.current = false;
                      animationDirectionRef.current = null;
                      setDragX(0);
                      goToNextPage();
                    }, 250);
                  } else if (dx > threshold && (currentPage > 0 || (currentPage === 0 && prevChapterId))) {
                    animationDirectionRef.current = 'prev';
                    isAnimatingRef.current = true;
                    setDragX(width);
                    setTimeout(() => {
                      isAnimatingRef.current = false;
                      animationDirectionRef.current = null;
                      setDragX(0);
                      goToPreviousPage();
                    }, 250);
                  } else {
                    setDragX(0);
                  }
                }}
                onMouseLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                    setDragX(0);
                  }
                }}
                onClick={(e) => {
                  if (didDragRef.current) { didDragRef.current = false; return; }
                  const { clientX, currentTarget } = e;
                  const { width, left } = currentTarget.getBoundingClientRect();
                  const x = clientX - left;
                  const leftThird = width / 3;
                  const rightThird = width * 2 / 3;
                  if (x < leftThird) {
                    if (currentPage > 0 || (currentPage === 0 && prevChapterId)) {
                      // 左侧点击：右滑动画到上一页
                      animationDirectionRef.current = 'prev';
                      isAnimatingRef.current = true;
                      setDragX(width);
                      setTimeout(() => {
                        isAnimatingRef.current = false;
                        animationDirectionRef.current = null;
                        setDragX(0);
                        goToPreviousPage();
                      }, 250);
                    }
                  } else if (x > rightThird && (currentPage < totalPages - 1 || pages[currentPage]?.type === 'comments')) {
                    // 右侧点击：左滑动画到下一页
                    animationDirectionRef.current = 'next';
                    isAnimatingRef.current = true;
                    setDragX(-width);
                    setTimeout(() => {
                      isAnimatingRef.current = false;
                      animationDirectionRef.current = null;
                      setDragX(0);
                      goToNextPage();
                    }, 250);
                  } else if (x >= leftThird && x <= rightThird) {
                    if (pages[currentPage]?.type !== 'comments') {
                      toggleMenu();
                    }
                  }
                }}
              >
                {/* 层叠页容器 */}
                <div className="absolute inset-0">
                  {pages.map((p, i) => {
                    const width = getContainerWidth();
                    const baseX = i < currentPage ? -width : 0;
                    let translateX = baseX;
                    if (isDragging) {
                      if (dragX < 0 && i === currentPage) {
                        translateX = baseX + dragX; // 当前页左滑
                      }
                      if (dragX > 0 && i === currentPage - 1) {
                        translateX = -width + dragX; // 上一页右滑入
                      }
                    } else {
                      // 动画期间使用 dragX 到达的目标值
                      if (isAnimatingRef.current) {
                        if (animationDirectionRef.current === 'next' && i === currentPage) {
                          translateX = -width;
                        }
                        if (animationDirectionRef.current === 'prev' && i === currentPage - 1) {
                          translateX = 0;
                        }
                      }
                    }
                    let z = 1;
                    if (i < currentPage - 1) {
                      z = 0; // 更早的历史页，最底层
                    } else if (i === currentPage - 1) {
                      z = dragX > 0 ? 6 : 2; // 右滑时上一页需浮在最上层
                    } else if (i === currentPage) {
                      z = 5; // 当前页
                    } else if (i === currentPage + 1) {
                      z = 4; // 紧邻的下一页，压在当前页之下，其它未来页之上
                    } else if (i > currentPage + 1) {
                      z = 1; // 其余未来页
                    }
                    const transition = isDragging ? 'none' : 'transform 250ms ease';
                    return (
                      <div
                        key={i}
                        className="absolute inset-0"
                        style={{ transform: `translateX(${translateX}px)`, transition, zIndex: z, backgroundColor: settings.backgroundColor }}
                      >
                        <div className={`max-w-3xl mx-auto px-4 py-4 h-full flex flex-col`}>
                          {p?.type === 'content' ? (
                            <>
                              {i === 0 && (
                                <h1 className={`text-2xl font-semibold mb-6 flex-shrink-0 transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} style={{ color: settings.textColor }}>
                                  {chapter.title}
                                </h1>
                              )}
                              <div
                                className={`prose max-w-none flex-1 transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'} ${isDark ? 'prose-invert' : ''}`}
                                style={{ color: settings.textColor }}
                              >
                                {cleanText(p?.content || '')
                                  .split('\n')
                                  .map((line, index) => {
                                    if (!line.trim()) {
                                      return null;
                                    }
                                    return (
                                      <p
                                        key={index}
                                        className="mb-5 first:mt-0 last:mb-0"
                                        style={{
                                          textIndent: '2em',
                                          lineHeight: settings.lineHeight,
                                          fontSize: settings.fontSize,
                                          fontFamily: settings.fontFamily,
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}
                                      >
                                        {line}
                                      </p>
                                    );
                                  })
                                  .filter(Boolean)}
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex flex-col">
                              <h1 className={`text-2xl font-semibold mb-6 flex-shrink-0 transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} style={{ color: settings.textColor }}>
                                {chapter.title} - 评论区
                              </h1>
                              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <h3 className={`text-lg font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>评论区</h3>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleToggleChapterLike}
                                    disabled={likeLoading}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${isLiked
                                      ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-300'
                                      : (isDark ? 'border-slate-600 text-slate-300 hover:border-slate-500' : 'border-slate-200 text-slate-600 hover:border-slate-300')
                                      } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={isLiked ? {} : (isDark ? { backgroundColor: '#191c1f' } : { backgroundColor: 'white' })}
                                  >
                                    {isLiked ? (
                                      <IconHeartFilled className="w-4 h-4" />
                                    ) : (
                                      <IconHeart className="w-4 h-4" stroke={1.8} />
                                    )}
                                    <span className="font-medium">
                                      {likeLoading ? '处理中' : isLiked ? '已赞' : '点赞'}
                                    </span>
                                    <span className="text-xs opacity-75">({likeCount})</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      modal.showForm({
                                        title: '举报章节',
                                        darkMode: isDark,
                                        confirmText: '提交举报',
                                        cancelText: '取消',
                                        children: (
                                          <div className="space-y-4">
                                            <div>
                                              <label className={`block text-sm font-medium mb-2 ${
                                                isDark ? 'text-slate-300' : 'text-gray-700'
                                              }`}>
                                                举报原因 *
                                              </label>
                                              <select
                                                name="reason"
                                                className={`w-full p-2 border rounded-md ${
                                                  isDark 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                }`}
                                                required
                                              >
                                                <option value="">请选择原因</option>
                                                <option value="违法违规">违法违规</option>
                                                <option value="色情低俗">色情低俗</option>
                                                <option value="广告垃圾">广告垃圾</option>
                                                <option value="恶意骚扰">恶意骚扰</option>
                                                <option value="侵犯版权">侵犯版权</option>
                                                <option value="其他">其他</option>
                                              </select>
                                            </div>
                                            <div>
                                              <label className={`block text-sm font-medium mb-2 ${
                                                isDark ? 'text-slate-300' : 'text-gray-700'
                                              }`}>
                                                详细描述
                                              </label>
                                              <textarea
                                                name="description"
                                                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${
                                                  isDark 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                }`}
                                                rows="3"
                                                placeholder="请描述具体问题..."
                                                maxLength="500"
                                              />
                                            </div>
                                          </div>
                                        ),
                                        onConfirm: (formElement) => {
                                          const formData = new FormData(formElement);
                                          const reason = formData.get('reason');
                                          const description = formData.get('description');
                                          if (!reason) {
                                            modal.showWarning({
                                              title: '请选择举报原因',
                                              message: '请先选择一个举报原因',
                                              darkMode: isDark
                                            });
                                            return false;
                                          }
                                          handleReportChapter(reason, description);
                                          return true;
                                        }
                                      });
                                    }}
                                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${isDark
                                      ? 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600'
                                      }`}
                                    style={isDark ? { backgroundColor: '#191c1f' } : { backgroundColor: 'white' }}
                                  >
                                    <IconMessagePlus className="w-4 h-4" stroke={1.8} />
                                    <span>举报</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <ChapterComments novelId={novelId} chapterId={chapterId} isDark={isDark} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 页数指示器 - 固定在右下角，仅显示文本 */}
                <div className="fixed bottom-4 right-4 z-10">
                  <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {currentPage + 1} / {totalPages}
                  </div>
                </div>
              </div>
            ) : (
              // 无内容或分页失败
              <div className="h-full flex items-center justify-center">
                <div className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-sm mx-auto px-4`}>
                  <div className="text-lg mb-4">📖</div>
                  <div className="text-sm mb-4">分页计算失败</div>
                  <div className="text-xs mb-6 opacity-75">
                    请尝试刷新页面或切换到滚动模式
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {

                        calculatePagination();
                      }}
                      className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${isDark
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      重新计算分页
                    </button>
                    <button
                      onClick={() => switchPaginationMode('scroll')}
                      className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      切换到滚动模式
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 顶部细进度条：仅切章时显示，避免整页闪烁 */}
      {switching && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-0.5 bg-blue-600 animate-pulse" />
        </div>
      )}

      {/* 菜单（统一白卡样式，可折叠） */}
      {menuVisible && (
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="max-w-5xl mx-auto px-4 pb-6">
            <div className={`${menuCardClasses} backdrop-blur-sm border rounded-2xl shadow-xl overflow-hidden transition-all ${menuCollapsed ? 'h-14' : ''}`} style={menuCardStyle}>
              <div className="flex items-center justify-between px-6 h-14">
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={() => setMenuCollapsed(v => !v)}
                    className={`flex items-center gap-2 px-2 md:px-3 py-1.5 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800'}`}
                    style={isDark ? { backgroundColor: 'rgba(26, 34, 35, 0.6)' } : { backgroundColor: 'rgba(148, 163, 184, 0.1)' }}
                    title={menuCollapsed ? '展开设置' : '收起设置'}
                  >
                    <IconChevronDown className={`w-4 h-4 transition-transform ${menuCollapsed ? 'rotate-180' : ''}`} stroke={1.8} />
                    <span className="hidden md:inline">{menuCollapsed ? '展开设置' : '收起设置'}</span>
                  </button>
                  <button
                    onClick={() => setCatalogOpen(v => !v)}
                    className={`flex items-center gap-2 px-2 md:px-3 py-1.5 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800'}`}
                    style={isDark ? { backgroundColor: 'rgba(26, 34, 35, 0.6)' } : { backgroundColor: 'rgba(148, 163, 184, 0.1)' }}
                    title="目录"
                  >
                    <IconFileText className="w-4 h-4" stroke={1.8} />
                    <span className="hidden md:inline">目录</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 md:gap-3">
                  <button
                    onClick={() => navigate(`/novel/${novelId}`)}
                    className={`flex items-center gap-2 px-2 md:px-4 py-2 text-sm rounded-lg transition-colors ${btnGhostClasses}`}
                    style={btnGhostStyle}
                    title="返回书籍页"
                  >
                    <IconArrowLeft className="w-4 h-4" stroke={1.8} />
                    <span className="hidden md:inline">返回书籍页</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-2 px-2 md:px-4 py-2 text-sm rounded-lg transition-colors ${btnGhostClasses}`}
                    style={btnGhostStyle}
                    title={isDark ? '切换到浅色模式' : '切换到深色模式'}
                  >
                    {isDark ? (
                      <IconSun className="w-4 h-4" stroke={1.8} />
                    ) : (
                      <IconMoon className="w-4 h-4" stroke={1.8} />
                    )}
                    <span className="hidden md:inline">{isDark ? '浅色' : '深色'}</span>
                  </button>
                </div>
              </div>
              {!menuCollapsed && (
                <div className={`px-4 md:px-6 py-3 md:py-5 border-t`} style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#f1f5f9' }}>
                  <div className="space-y-3 md:space-y-4">
                    {/* 常用功能 - 可折叠（默认展开） */}
                    <div>
                      <button
                        onClick={() => setSettingsCollapsed(prev => ({ ...prev, common: !prev.common }))}
                        className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <IconBookmark className="w-4 h-4" stroke={1.8} />
                          <span className="text-sm font-medium">常用功能</span>
                        </div>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.common ? 'rotate-180' : ''}`} stroke={1.8} />
                      </button>
                      {!settingsCollapsed.common && (
                        <div className="mt-2 pl-6">
                          <div className="flex flex-wrap gap-2">
                            {/* 收藏按钮（挪入常用功能） */}
                            <button
                              onClick={handleBookmarkToggle}
                              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${bookmarkExists ? 'bg-amber-500 text-white hover:bg-amber-600' : btnGhostClasses}`}
                              style={!bookmarkExists ? btnGhostStyle : {}}
                              title={bookmarkExists ? '移除收藏' : '添加收藏'}
                            >
                              {bookmarkExists ? (
                                <IconBookmarkFilled className="w-4 h-4" />
                              ) : (
                                <IconBookmark className="w-4 h-4" stroke={1.8} />
                              )}
                              <span>{bookmarkExists ? '已收藏' : '收藏'}</span>
                            </button>

                            {/* 书签抽屉打开按钮 */}
                            <button
                              onClick={() => setBookmarksOpen(true)}
                              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${btnGhostClasses}`}
                              style={btnGhostStyle}
                            >
                              <IconFileText className="w-4 h-4" stroke={1.8} />
                              <span>书签</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* 字体设置 - 可折叠 */}
                    <div>
                      <button
                        onClick={() => setSettingsCollapsed(prev => ({ ...prev, font: !prev.font }))}
                        className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <IconFileText className="w-4 h-4" stroke={1.8} />
                          <span className="text-sm font-medium">字体设置</span>
                        </div>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.font ? 'rotate-180' : ''}`} stroke={1.8} />
                      </button>
                      {!settingsCollapsed.font && (
                        <div className="space-y-3 mt-2 pl-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>字体</label>
                              <select
                                value={settings.fontFamily}
                                onChange={(e) => applySetting({ fontFamily: e.target.value })}
                                className={`w-full px-2 py-1.5 text-sm border rounded-md transition-colors ${isDark ? 'text-slate-100' : 'bg-white border-slate-300 text-slate-700'}`}
                                style={isDark ? { backgroundColor: '#1a2223', borderColor: '#232c2e' } : {}}
                              >
                                <option value={defaultSettings.fontFamily}>系统默认</option>
                                <option value={'Georgia, serif'}>Georgia</option>
                                <option value={'\"Times New Roman\", Times, serif'}>Times</option>
                                <option value={'\"Helvetica Neue\", Helvetica, Arial, sans-serif'}>Helvetica</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>字号：{settings.fontSize}px</label>
                              <input
                                type="range"
                                min={14}
                                max={28}
                                value={settings.fontSize}
                                onChange={(e) => applySetting({ fontSize: Number(e.target.value) })}
                                className="w-full accent-blue-600"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>行高：{settings.lineHeight}</label>
                              <input
                                type="range"
                                min={1.4}
                                max={2.2}
                                step={0.1}
                                value={settings.lineHeight}
                                onChange={(e) => applySetting({ lineHeight: Number(e.target.value) })}
                                className="w-full accent-blue-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 颜色设置 - 可折叠 */}
                    <div>
                      <button
                        onClick={() => setSettingsCollapsed(prev => ({ ...prev, color: !prev.color }))}
                        className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <IconPalette className="w-4 h-4" stroke={1.8} />
                          <span className="text-sm font-medium">颜色设置</span>
                        </div>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.color ? 'rotate-180' : ''}`} stroke={1.8} />
                      </button>
                      {!settingsCollapsed.color && (
                        <div className="space-y-4 mt-2 pl-6">
                          {/* 当前模式设置 */}
                          <div>
                            <div className={`flex items-center gap-2 mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              {isDark ? (
                                <IconMoon className="w-4 h-4" stroke={1.8} />
                              ) : (
                                <IconSun className="w-4 h-4" stroke={1.8} />
                              )}
                              <span className="text-xs font-semibold">{isDark ? '深色模式' : '浅色模式'} (当前)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>背景色</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={settings.backgroundColor}
                                    onChange={(e) => applySetting({ backgroundColor: e.target.value })}
                                    className="w-8 h-6 rounded border border-slate-300"
                                  />
                                  <span className={`text-xs flex-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{settings.backgroundColor}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>文字色</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={settings.textColor}
                                    onChange={(e) => applySetting({ textColor: e.target.value })}
                                    className="w-8 h-6 rounded border border-slate-300"
                                  />
                                  <span className={`text-xs flex-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{settings.textColor}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 另一种模式的预览设置 */}
                          <div className={`pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className={`flex items-center gap-2 mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {!isDark ? (
                                <IconMoon className="w-4 h-4" stroke={1.8} />
                              ) : (
                                <IconSun className="w-4 h-4" stroke={1.8} />
                              )}
                              <span className="text-xs font-semibold">{!isDark ? '深色模式' : '浅色模式'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>背景色</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={(() => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      if (saved) {
                                        try {
                                          return JSON.parse(saved).backgroundColor;
                                        } catch { }
                                      }
                                      return isDark ? defaultSettings.backgroundColor : defaultDark.backgroundColor;
                                    })()}
                                    onChange={(e) => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      let otherSettings = isDark ? defaultSettings : defaultDark;
                                      if (saved) {
                                        try { otherSettings = JSON.parse(saved); } catch { }
                                      }
                                      localStorage.setItem(otherKey, JSON.stringify({
                                        ...otherSettings,
                                        backgroundColor: e.target.value
                                      }));
                                    }}
                                    className="w-8 h-6 rounded border border-slate-300 opacity-75"
                                  />
                                  <span className={`text-xs flex-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {(() => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      if (saved) {
                                        try {
                                          return JSON.parse(saved).backgroundColor;
                                        } catch { }
                                      }
                                      return isDark ? defaultSettings.backgroundColor : defaultDark.backgroundColor;
                                    })()}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>文字色</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={(() => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      if (saved) {
                                        try {
                                          return JSON.parse(saved).textColor;
                                        } catch { }
                                      }
                                      return isDark ? defaultSettings.textColor : defaultDark.textColor;
                                    })()}
                                    onChange={(e) => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      let otherSettings = isDark ? defaultSettings : defaultDark;
                                      if (saved) {
                                        try { otherSettings = JSON.parse(saved); } catch { }
                                      }
                                      localStorage.setItem(otherKey, JSON.stringify({
                                        ...otherSettings,
                                        textColor: e.target.value
                                      }));
                                    }}
                                    className="w-8 h-6 rounded border border-slate-300 opacity-75"
                                  />
                                  <span className={`text-xs flex-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {(() => {
                                      const otherKey = isDark ? SETTINGS_KEY_LIGHT : SETTINGS_KEY_DARK;
                                      const saved = localStorage.getItem(otherKey);
                                      if (saved) {
                                        try {
                                          return JSON.parse(saved).textColor;
                                        } catch { }
                                      }
                                      return isDark ? defaultSettings.textColor : defaultDark.textColor;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 阅读线选择 - 只在非传统模式下显示 */}
                    {novel && novel.novel_type !== 'traditional' && (
                      <div>
                        <button
                          onClick={() => setSettingsCollapsed(prev => ({ ...prev, readingPath: !prev.readingPath }))}
                          className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                        >
                          <div className="flex items-center gap-2">
                            <IconRoute className="w-4 h-4" stroke={1.8} />
                            <span className="text-sm font-medium">阅读线</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              {readingMode === 'ask' ? '询问' :
                                readingMode === 'custom' ? '自定义' :
                                  readingMode === 'author_recommended' ? '推荐' : '随机'}
                            </span>
                          </div>
                          <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.readingPath ? 'rotate-180' : ''}`} stroke={1.8} />
                        </button>
                        {!settingsCollapsed.readingPath && (
                          <div className="space-y-2 mt-2 pl-6">
                            <div className="grid grid-cols-1 gap-2">
                              {/* 询问模式 */}
                              <button
                                onClick={() => switchReadingMode('ask', null)}
                                className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${readingMode === 'ask'
                                  ? 'bg-blue-600 text-white'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <IconHelp className="w-4 h-4" stroke={1.8} />
                                  <span>询问模式</span>
                                </div>
                                <span className="text-xs opacity-75">每次选择分支</span>
                              </button>

                              {/* 自定义阅读线 */}
                              {isAuthenticated && (
                                <button
                                  onClick={async () => {
                                    const customPath = readingPaths.find(p => p.path_type === 'custom' && p.is_mine);
                                    if (customPath) {
                                      await switchReadingMode('custom', customPath);
                                    } else {
                                      // 跳转到创建自定义阅读线页面
                                      navigate(`/novel/${novelId}/custom-reading-path`);
                                    }
                                  }}
                                  className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${readingMode === 'custom'
                                    ? 'bg-blue-600 text-white'
                                    : isDark
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconUser className="w-4 h-4" stroke={1.8} />
                                    <span>自定义线路</span>
                                  </div>
                                  <span className="text-xs opacity-75">
                                    {readingPaths.find(p => p.path_type === 'custom' && p.is_mine) ? '已创建' : '创建'}
                                  </span>
                                </button>
                              )}

                              {/* 作者推荐阅读线 */}
                              {readingPaths.find(p => p.path_type === 'author_recommended') && (
                                <button
                                  onClick={async () => {
                                    const authorPath = readingPaths.find(p => p.path_type === 'author_recommended');
                                    await switchReadingMode('author_recommended', authorPath);
                                  }}
                                  className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${readingMode === 'author_recommended'
                                    ? 'bg-blue-600 text-white'
                                    : isDark
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconStar className="w-4 h-4" stroke={1.8} />
                                    <span>作者推荐</span>
                                  </div>
                                  <span className="text-xs opacity-75">官方路线</span>
                                </button>
                              )}

                              {/* 随机漫步 */}
                              <button
                                onClick={() => switchReadingMode('random', null)}
                                className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${readingMode === 'random'
                                  ? 'bg-blue-600 text-white'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <IconHeart className="w-4 h-4" stroke={1.8} />
                                  <span>随机漫步</span>
                                </div>
                                <span className="text-xs opacity-75">意外惊喜</span>
                              </button>
                            </div>

                            {/* 当前阅读线信息 */}
                            {currentReadingPath && (
                              <div className={`mt-3 p-2 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                <div className="font-medium">{currentReadingPath.name}</div>
                                {currentReadingPath.description && (
                                  <div className="mt-1 opacity-75">{currentReadingPath.description}</div>
                                )}
                                <div className="mt-1 opacity-60">
                                  {currentReadingPath.total_chapters} 章节 • {(currentReadingPath.total_words || 0).toLocaleString()} 字
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 翻页设置 - 可折叠 */}
                    <div>
                      <button
                        onClick={() => setSettingsCollapsed(prev => ({ ...prev, pagination: !prev.pagination }))}
                        className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <IconFileText className="w-4 h-4" stroke={1.8} />
                          <span className="text-sm font-medium">翻页模式</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {paginationMode === 'scroll' ? '滚动' : '翻页'}
                          </span>
                        </div>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.pagination ? 'rotate-180' : ''}`} stroke={1.8} />
                      </button>
                      {!settingsCollapsed.pagination && (
                        <div className="space-y-2 mt-2 pl-6">
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              onClick={() => switchPaginationMode('scroll')}
                              className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${paginationMode === 'scroll'
                                ? 'bg-blue-600 text-white'
                                : isDark
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconChevronUp className="w-4 h-4" stroke={1.8} />
                                <span>滚动模式</span>
                              </div>
                              <span className="text-xs opacity-75">连续滚动</span>
                            </button>

                            <button
                              onClick={() => switchPaginationMode('horizontal')}
                              className={`flex items-center justify-between w-full p-2 text-sm rounded-lg transition-colors ${paginationMode === 'horizontal'
                                ? 'bg-blue-600 text-white'
                                : isDark
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconChevronRight className="w-4 h-4" stroke={1.8} />
                                <span>水平翻页</span>
                              </div>
                              <span className="text-xs opacity-75">分页阅读</span>
                            </button>
                          </div>

                          {/* 翻页状态信息 */}
                          {paginationMode === 'horizontal' && (
                            <div className={`mt-3 p-2 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                              {paginationLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                  <span>正在计算分页...</span>
                                </div>
                              ) : totalPages > 0 ? (
                                <div>
                                  <div className="font-medium">第 {currentPage + 1} 页 / 共 {totalPages} 页</div>
                                  <div className="mt-1 opacity-75">
                                    {pages[currentPage]?.type === 'comments' ? '评论区' : '正文内容'}
                                  </div>
                                </div>
                              ) : (
                                <div className="opacity-75">等待分页计算...</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 导航按钮 - 可折叠 */}
                    <div>
                      <button
                        onClick={() => setSettingsCollapsed(prev => ({ ...prev, navigation: !prev.navigation }))}
                        className={`flex items-center justify-between w-full text-left py-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <IconNavigation className="w-4 h-4" stroke={1.8} />
                          <span className="text-sm font-medium">章节导航</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {chapterIndex + 1}/{chapters.length}
                          </span>
                        </div>
                        <IconChevronDown className={`w-4 h-4 transition-transform ${settingsCollapsed.navigation ? 'rotate-180' : ''}`} stroke={1.8} />
                      </button>
                      {!settingsCollapsed.navigation && (
                        <div className="space-y-2 mt-3 pl-6">
                          {/* 翻页导航 - 仅在水平翻页模式下显示 */}
                          {paginationMode === 'horizontal' && totalPages > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-3 select-none">
                              <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 0}
                                className={`px-2 py-1 rounded-lg transition-colors ${currentPage === 0
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                                  }`}
                                title="上一页"
                              >
                                <IconChevronLeft className="w-3 h-3" stroke={2} />
                              </button>
                              <span className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                {currentPage + 1} / {totalPages}
                              </span>
                              <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages - 1}
                                className={`px-2 py-1 rounded-lg transition-colors ${currentPage === totalPages - 1
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                                  }`}
                                title="下一页"
                              >
                                <IconChevronRight className="w-3 h-3" stroke={2} />
                              </button>
                            </div>
                          )}

                          {/* 章节导航 */}
                          <div className="flex items-center justify-center gap-3 select-none">
                            <button
                              onClick={() => handleNavigate('prev')}
                              className={`px-2 py-1 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
                              title="上一章"
                            >
                              <IconChevronLeft className="w-3 h-3" stroke={2} />
                            </button>
                            <button
                              onClick={() => handleNavigate('next')}
                              className={`px-2 py-1 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
                              title="下一章"
                            >
                              <IconChevronRight className="w-3 h-3" stroke={2} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 目录抽屉 */}
      {catalogOpen && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 ${overlayBg}`} onClick={() => setCatalogOpen(false)} />
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-xl ${drawerBg} shadow-2xl border-l flex flex-col`} style={drawerStyle}>
            <div className={`px-6 py-4 border-b flex items-center justify-between`} style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>目录</h3>
                </div>
                <div className={`flex rounded-lg overflow-hidden border-2`} style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#e2e8f0' }}>
                  <button
                    onClick={() => setCatalogMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${catalogMode === 'list' ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800')}`}
                    style={catalogMode !== 'list' && isDark ? { backgroundColor: '#1a2223' } : {}}
                  >
                    列表
                  </button>
                  <button
                    onClick={() => setCatalogMode('view')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${catalogMode === 'view' ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800')}`}
                    style={catalogMode !== 'view' && isDark ? { backgroundColor: '#1a2223' } : {}}
                  >
                    视图
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCatalogOpen(false)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <IconX className="w-5 h-5" stroke={1.8} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {catalogMode === 'list' ? (
                <div className="space-y-3">
                  {chapters.map((c, index) => (
                    <button
                      key={c.id}
                      onClick={() => { setCatalogOpen(false); navigate(`/novel/${novelId}/read/${c.id}`); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 group ${c.id === chapter.id
                        ? (isDark ? 'border-blue-500 shadow-lg' : 'bg-blue-50 border-blue-300 shadow-md')
                        : (isDark ? 'border-transparent hover:border-slate-600 hover:shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md')
                        }`}
                      style={c.id === chapter.id && isDark ? { backgroundColor: 'rgba(37, 99, 235, 0.15)' } : (c.id !== chapter.id && isDark ? { backgroundColor: '#1a2223' } : {})}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${c.id === chapter.id
                              ? 'bg-blue-600 text-white'
                              : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')
                              }`}>
                              {index + 1}
                            </span>
                            <h4 className={`font-medium text-sm truncate ${c.id === chapter.id
                              ? (isDark ? 'text-blue-300' : 'text-blue-800')
                              : (isDark ? 'text-slate-200' : 'text-slate-800')
                              }`}>
                              {c.title}
                            </h4>
                          </div>
                          {c.author_username && (
                            <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              作者：
                              {c.author_id ? (
                                <Link 
                                  to={`/profile/${c.author_id}`}
                                  className={`${isDark ? 'text-slate-300' : 'text-slate-700'} hover:underline`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.author_username}
                                </Link>
                              ) : (
                                c.author_username
                              )}
                            </p>
                          )}
                        </div>
                        {c.id === chapter.id && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                              <span className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>正在阅读</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-[70vh]">
                  <NovelEditView novel={novel || { id: novelId }} chapters={chapters} linkMode="read" currentChapterId={chapter.id} isDark={isDark} viewCentered={viewCentered} setViewCentered={setViewCentered} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 书签抽屉 */}
      {bookmarksOpen && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 ${overlayBg}`} onClick={() => setBookmarksOpen(false)} />
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md ${drawerBg} shadow-2xl border-l flex flex-col`} style={drawerStyle}>
            <div className={`px-6 py-4 border-b flex items-center justify-between`} style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2">
                <IconBookmark className="w-5 h-5" />
                <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>书签</h3>
              </div>
              <button
                onClick={() => setBookmarksOpen(false)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <IconX className="w-5 h-5" stroke={1.8} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">本书书签</div>
                <BookmarkList items={bookmarks} emptyText="暂无本书书签" onJump={(cid) => { setBookmarksOpen(false); navigate(`/novel/${novelId}/read/${cid}`); }} />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">全局书签</div>
                <BookmarkList items={globalBookmarks} emptyText="暂无全局书签" onJump={(cid, nid) => { setBookmarksOpen(false); navigate(`/novel/${nid}/read/${cid}`); }} />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">其它书书签</div>
                <BookmarkList items={otherBookmarks} emptyText="暂无其它书书签" onJump={(cid, nid) => { setBookmarksOpen(false); navigate(`/novel/${nid}/read/${cid}`); }} />
              </div>
              <div>
                <button
                  onClick={async () => {
                    if (!chapter) return;
                    const res = await addBookmark(chapter.id, null, false);
                    if (res && res.success) {
                      await loadBookmarks();
                    }
                  }}
                  className={`w-full px-3 py-2 rounded ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  将当前章节加入本书书签
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 分支选择弹窗 */}
      {branchChoices && branchChoices.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${overlayBg}`} onClick={() => setBranchChoices(null)}></div>
          <div className={`relative ${isDark ? 'text-slate-100' : 'bg-white text-slate-800 border-slate-200'} rounded-2xl shadow-2xl w-full max-w-md mx-auto border`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
            <div className="flex items-center justify-between p-6 border-b" style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-500 text-white rounded-lg">
                  <IconHelp className="w-5 h-5" stroke={1.8} />
                </div>
                <div>
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>选择下一章</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>发现多个分支，请选择一个继续阅读</p>
                </div>
              </div>
              <button
                onClick={() => setBranchChoices(null)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <IconX className="w-5 h-5" stroke={1.8} />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {branchChoices.map((b, index) => (
                <button
                  key={b.id}
                  onClick={() => { setBranchChoices(null); navigate(`/novel/${novelId}/read/${b.id}`); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${isDark ? 'border-transparent hover:border-slate-600 hover:shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                  style={isDark ? { backgroundColor: '#1a2223' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-medium text-sm ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{b.title}</div>
                      {b.author_username && (
                        <div className={`text-xs truncate mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          作者：
                          {b.author_id ? (
                            <Link 
                              to={`/profile/${b.author_id}`}
                              className={`${isDark ? 'text-slate-300' : 'text-slate-700'} hover:underline`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {b.author_username}
                            </Link>
                          ) : (
                            b.author_username
                          )}
                        </div>
                      )}
                    </div>
                    <IconChevronRight className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} stroke={1.8} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReaderPage;


