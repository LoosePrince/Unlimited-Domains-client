import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getAllNovels, getNovelStats } from '../services/novelAPI';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import { 
  IconFileText, 
  IconSearch, 
  IconStar, 
  IconFlame, 
  IconFilter 
} from '@tabler/icons-react';

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [novels, setNovels] = useState([]);
  const [tagStats, setTagStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('mixed'); // mixed, recent, chapters
  const navigate = useNavigate();

  // 从URL参数获取初始标签
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTags([tagParam]);
    }
  }, [searchParams]);

  // 获取标签统计
  useEffect(() => {
    const fetchTagStats = async () => {
      try {
        const result = await getNovelStats();
        if (result.success && result.tagStats) {
          setTagStats(result.tagStats);
        }
      } catch (error) {
        console.error('获取标签统计失败:', error);
      }
    };
    fetchTagStats();
  }, []);

  // 获取小说列表
  useEffect(() => {
    const fetchNovels = async () => {
      setLoading(true);
      try {
        let sortParam = 'updated_at';
        if (sortBy === 'chapters') {
          sortParam = 'chapters';
        } else if (sortBy === 'mixed') {
          // 混合排序：最近更新70% + 章节数30%
          sortParam = 'mixed';
        }

        const result = await getAllNovels({
          limit: 50,
          sortBy: sortParam,
          tags: selectedTags.length > 0 ? selectedTags : undefined
        });

        // console.log('API调用参数:', { limit: 50, sortBy: sortParam, tags: selectedTags });
        // console.log('API返回结果:', result);

        if (result.success) {
          let sortedNovels = result.novels || [];

          // 如果是混合排序，需要前端处理
          if (sortBy === 'mixed') {
            sortedNovels = sortNovelsByMixed(sortedNovels);
          }

          setNovels(sortedNovels);
        }
      } catch (error) {
        console.error('获取小说列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [selectedTags, sortBy]);

  // 混合排序算法：最近更新70% + 章节数30%
  const sortNovelsByMixed = (novels) => {
    if (novels.length === 0) return novels;

    return [...novels].sort((a, b) => {
      // 计算最近更新得分（0-1）
      const now = new Date();
      const maxDays = 30; // 30天内的更新
      const aUpdateDays = Math.max(0, (now - new Date(a.updated_at)) / (1000 * 60 * 60 * 24));
      const bUpdateDays = Math.max(0, (now - new Date(b.updated_at)) / (1000 * 60 * 60 * 24));

      const aUpdateScore = Math.max(0, 1 - (aUpdateDays / maxDays));
      const bUpdateScore = Math.max(0, 1 - (bUpdateDays / maxDays));

      // 计算章节数得分（0-1）
      const maxChapters = Math.max(...novels.map(n => n.total_chapters || n.totalChapters || 0));
      const aChapterScore = maxChapters > 0 ? (a.total_chapters || a.totalChapters || 0) / maxChapters : 0;
      const bChapterScore = maxChapters > 0 ? (b.total_chapters || b.totalChapters || 0) / maxChapters : 0;

      // 混合得分：更新70% + 章节30%
      const aScore = aUpdateScore * 0.7 + aChapterScore * 0.3;
      const bScore = bUpdateScore * 0.7 + bChapterScore * 0.3;

      return bScore - aScore;
    });
  };

  // 处理标签选择
  const handleTagToggle = (tagName) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(tag => tag !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  // 清除所有标签
  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // 获取小说类型名称
  const getNovelTypeName = (type) => {
    const typeMap = {
      'author_original': '作者独创',
      'mountain_beyond_mountain': '山外有山',
      'infinite_point': '无限点',
      'traditional': '传统'
    };
    return typeMap[type] || type;
  };

  // 跳转到小说详情页
  const goToNovelDetail = (novelId) => {
    navigate(`/novel/${novelId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧侧边栏 */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              {/* 精选 */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IconStar className="w-5 h-5 text-yellow-500" stroke={1.5} />
                  精选
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <IconFileText className="w-8 h-8 text-gray-400" stroke={1.8} />
                  </div>
                  <p>暂无精选内容</p>
                </div>
              </div>

              {/* 热门 */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IconFlame className="w-5 h-5 text-orange-500" stroke={1.5} />
                  热门
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <IconFileText className="w-8 h-8 text-gray-400" stroke={1.8} />
                  </div>
                  <p>暂无热门内容</p>
                </div>
              </div>

              {/* 筛选 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IconFilter className="w-5 h-5 text-blue-500" stroke={1.5} />
                  筛选
                </h3>

                {/* 排序方式 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mixed">混合排序</option>
                    <option value="recent">最近更新</option>
                    <option value="chapters">章节数量</option>
                  </select>
                </div>

                {/* 标签筛选 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">标签筛选</label>
                    {selectedTags.length > 0 && (
                      <button
                        onClick={clearAllTags}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        清除全部
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tagStats.map((tag) => (
                      <label key={tag.name} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.name)}
                          onChange={() => handleTagToggle(tag.name)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {tag.name}
                          <span className="text-gray-500 ml-1">
                            ({tag.novelcount || tag.novelCount || 0})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 已选标签 */}
                {selectedTags.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">已选标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            onClick={() => handleTagToggle(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* 右侧内容区域 */}
          <div className="flex-1">
            {/* 页面标题和统计 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">发现故事</h1>
              <p className="text-gray-600">
                找到 {novels.length} 个故事
                {selectedTags.length > 0 && ` · 标签：${selectedTags.join(', ')}`}
              </p>
            </div>

            {/* 小说列表 */}
            {loading ? (
              // 加载状态 - 左右布局骨架屏
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="flex">
                      {/* 左侧封面骨架 */}
                      <div className="flex-shrink-0 p-3 flex items-center justify-center">
                        <div className="w-32 h-40 bg-gray-200 rounded-lg"></div>
                      </div>
                      {/* 右侧内容骨架 */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : novels.length > 0 ? (
              // 显示小说列表
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {novels.map((novel) => (
                  <button
                    key={novel.id}
                                            onClick={() => goToNovelDetail(novel.id)}
                    className="text-left block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
                  >
                    <div className="flex">
                      {/* 左侧封面 */}
                      <div className="flex-shrink-0 p-3 flex items-center justify-center">
                        <NovelCoverAdvanced
                          title={novel.title}
                          author={novel.author_username || '未知'}
                          theme="default"
                          coverUrl={novel.cover_image_url}
                          className="w-32 h-40"
                        />
                      </div>
                      {/* 右侧内容 */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500">
                            {novel.tags && novel.tags.length > 0 ? novel.tags[0] : '未分类'} · {getNovelTypeName(novel.novel_type)}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {novel.total_chapters || novel.totalChapters || 0}章
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{novel.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {novel.description || '暂无描述...'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            作者：
                            {novel.author_id ? (
                              <Link
                                to={`/profile/${novel.author_id}`}
                                className="text-gray-600 hover:text-gray-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {novel.author_username || '未知'}
                              </Link>
                            ) : (
                              novel.author_username || '未知'
                            )}
                          </span>
                          <span>{new Date(novel.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // 无数据状态
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconFileText className="w-12 h-12 text-gray-400" stroke={1.8} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到故事</h3>
                <p className="text-gray-500">
                  {selectedTags.length > 0
                    ? `没有找到包含标签"${selectedTags.join(', ')}"的故事`
                    : '暂时没有可用的故事'
                  }
                </p>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    清除筛选条件
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExplorePage;
