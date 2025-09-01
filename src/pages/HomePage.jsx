import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import { getAllNovels, getNovelStats } from '../services/novelAPI';
import { IconFileText, IconClock, IconBook2, IconTags, IconBooks, IconTrees, IconTarget, IconUsersGroup } from '@tabler/icons-react';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalNovels: 0,
    activeNovels: 0,
    totalCreators: 0,
    totalChapters: 0
  });
  const [recentNovels, setRecentNovels] = useState([]);
  const [tagStats, setTagStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取小说类型中文名称
  const getNovelTypeName = (type) => {
    const typeMap = {
      'author_original': '作者独创',
      'mountain_beyond_mountain': '山外有山',
      'infinite_point': '无限点',
      'traditional': '传统'
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);

      // 获取统计数据和标签统计
      const statsResult = await getNovelStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
        // 处理标签统计
        if (statsResult.tagStats && Array.isArray(statsResult.tagStats)) {
          // 按标签下小说数量和时间排序
          const sortedTags = statsResult.tagStats.sort((a, b) => {
            const countA = parseInt(a.novelcount || a.novelCount || 0);
            const countB = parseInt(b.novelcount || b.novelCount || 0);
            if (countA !== countB) {
              return countB - countA; // 数量多的在前
            }
            const dateA = new Date(a.latestupdate || a.latestUpdate);
            const dateB = new Date(b.latestupdate || b.latestUpdate);
            return dateB - dateA; // 数量相同则新的在前
          });
          setTagStats(sortedTags);
        }
      }

      // 获取最近更新的小说
      const novelsResult = await getAllNovels({ limit: 6, sortBy: 'updated_at' });
      if (novelsResult.success) {
        setRecentNovels(novelsResult.novels || []);
      }
    } catch (error) {
      console.error('获取首页数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 跳转到小说详情页
  const goToNovelDetail = (novelId) => {
    navigate(`/novel/${novelId}`);
  };

  return (
    <div className="gradient-bg min-h-screen">
      {/* 装饰元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ornament absolute top-20 left-20 w-16 h-16 opacity-30"></div>
        <div className="ornament absolute top-40 right-32 w-12 h-12 opacity-20"></div>
        <div className="ornament absolute bottom-32 left-32 w-20 h-20 opacity-25"></div>
        <div className="ornament absolute bottom-20 right-20 w-14 h-14 opacity-30"></div>

        {/* 几何装饰 */}
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-slate-300 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-16 w-1 h-1 bg-slate-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-slate-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-slate-300 rounded-full opacity-40"></div>
      </div>

      {/* 导航栏 */}
      <Navigation />

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 英雄区域 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-light text-slate-700 mb-6 text-glow">
            探索无限可能的故事世界
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            站在巨人的肩膀上，创建独属于你的故事。在这里，每个章节都可以有无限的分支，每个故事都有无限的可能。
          </p>

          {/* 首页搜索框 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = e.target.homeSearch.value.trim();
              if (query) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <input
                type="text"
                name="homeSearch"
                placeholder="搜索书名、简介、作者、标签..."
                className="w-full px-6 py-4 text-lg border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-lg bg-white/90 backdrop-blur-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 px-6 py-2 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-slate-700 text-white px-8 py-3 rounded-lg text-lg hover:bg-slate-800 transition-colors btn-transition btn-hover"
              >
                进入创作
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-slate-700 text-white px-8 py-3 rounded-lg text-lg hover:bg-slate-800 transition-colors btn-transition btn-hover"
              >
                开始创作
              </Link>
            )}
            <Link
              to="/explore"
              className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg text-lg hover:bg-slate-50 transition-colors btn-transition"
            >
              浏览故事
            </Link>
          </div>
        </section>

        {/* 统计信息 */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center card-shadow">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                {loading ? '...' : stats.totalNovels.toLocaleString()}
              </div>
              <div className="text-slate-600">全部故事</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center card-shadow">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                {loading ? '...' : stats.activeNovels.toLocaleString()}
              </div>
              <div className="text-slate-600">活跃故事</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center card-shadow">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                {loading ? '...' : stats.totalCreators.toLocaleString()}
              </div>
              <div className="text-slate-600">创作者</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center card-shadow">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                {loading ? '...' : stats.totalChapters.toLocaleString()}
              </div>
              <div className="text-slate-600">章节总数</div>
            </div>
          </div>
        </section>

        {/* 最近更新 */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl md:text-3xl font-medium text-slate-700 inline-flex items-center gap-2"><IconClock className="w-6 h-6" stroke={1.8} /> 最近更新</h3>
            <Link to="/explore" className="text-slate-600 hover:text-slate-900 transition-colors">
              查看全部 →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // 加载状态 - 左右布局骨架屏
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="novel-card bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden card-shadow animate-pulse">
                  <div className="flex">
                    {/* 左侧封面骨架 */}
                    <div className="flex-shrink-0 p-3 flex items-center justify-center">
                      <div className="w-32 h-40 bg-slate-200 rounded-lg"></div>
                    </div>
                    {/* 右侧内容骨架 */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="h-4 bg-slate-200 rounded mb-3"></div>
                      <div className="h-6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded mb-4 w-3/4"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : recentNovels.length > 0 ? (
              // 显示最近更新的小说
              recentNovels.map((novel) => (
                <button
                  key={novel.id}
                                          onClick={() => goToNovelDetail(novel.id)}
                  className="text-left novel-card bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden card-shadow hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    {/* 左侧封面 */}
                    <div className="flex-shrink-0 p-3 flex items-center justify-center">
                      <NovelCoverAdvanced
                        title={novel.title}
                        author={novel.author?.username || novel.author_name || '未知'}
                        theme="default"
                        coverUrl={novel.cover_image_url}
                        className="w-32 h-40"
                      />
                    </div>
                    {/* 右侧内容 */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-500">
                          {novel.tags && novel.tags.length > 0 ? novel.tags[0] : '未分类'} · {getNovelTypeName(novel.novel_type)}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">最近更新</span>
                      </div>
                      <h4 className="text-lg font-medium text-slate-700 mb-2">{novel.title}</h4>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {novel.description || '暂无描述...'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>
                          作者：
                          {novel.author?.id ? (
                            <Link 
                              to={`/profile/${novel.author.id}`}
                              className="text-slate-600 hover:text-slate-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {novel.author?.username || novel.author_name || '未知'}
                            </Link>
                          ) : (
                            novel.author?.username || novel.author_name || '未知'
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1"><IconBook2 className="w-4 h-4" stroke={1.8} /> {novel.total_chapters || 0}章</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              // 无数据状态
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">还没有故事</h3>
                <p className="text-slate-500">成为第一个创作故事的人吧！</p>
              </div>
            )}
          </div>
        </section>

        {/* 分类标签 */}
        <section className="mb-16">
          <h3 className="text-2xl md:text-3xl font-medium text-slate-700 mb-8 inline-flex items-center gap-2"><IconTags className="w-6 h-6" stroke={1.8} /> 分类标签</h3>



          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              // 加载状态
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="category-tag bg-slate-100 text-slate-700 px-4 py-3 rounded-lg text-center animate-pulse">
                  <div className="flex items-center justify-center mb-2"><IconBooks className="w-6 h-6" stroke={1.8} /></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </div>
              ))
            ) : tagStats.length > 0 ? (
              // 显示标签统计
              tagStats.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/explore?tag=${encodeURIComponent(tag.name)}`}
                  className="category-tag bg-slate-100 text-slate-700 px-4 py-3 rounded-lg text-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center mb-2"><IconBooks className="w-6 h-6" stroke={1.8} /></div>
                  <div className="text-sm font-medium">{tag.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {tag.novelcount || tag.novelCount || 0}本
                  </div>
                </Link>
              ))
            ) : (
              // 无数据状态
              <div className="col-span-full text-center py-8">
                <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
                <p className="text-slate-500">暂无分类标签</p>
              </div>
            )}
          </div>
        </section>

        {/* 特色功能 */}
        <section className="mb-16">
          <h3 className="text-2xl md:text-3xl font-medium text-slate-700 mb-8 text-center">特色功能</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconTrees className="w-8 h-8 text-blue-600" stroke={1.8} />
              </div>
              <h4 className="text-lg font-medium text-slate-700 mb-2">分支创作</h4>
              <p className="text-slate-600">每个章节都可以创建无限分支，让故事走向无限可能</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconTarget className="w-8 h-8 text-green-600" stroke={1.8} />
              </div>
              <h4 className="text-lg font-medium text-slate-700 mb-2">自定义阅读</h4>
              <p className="text-slate-600">自由选择阅读路径，创造属于你的独特故事体验</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconUsersGroup className="w-8 h-8 text-purple-600" stroke={1.8} />
              </div>
              <h4 className="text-lg font-medium text-slate-700 mb-2">社区协作</h4>
              <p className="text-slate-600">与全球创作者一起，共同构建精彩的故事世界</p>
            </div>
          </div>
        </section>

        {/* 加入我们 */}
        <section className="text-center mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 card-shadow">
            <h3 className="text-2xl md:text-3xl font-medium text-slate-700 mb-4">
              加入无限域，开启创作之旅
            </h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              无论你是经验丰富的作家，还是初出茅庐的新手，这里都有属于你的创作空间。让我们一起探索故事的无限可能。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-slate-700 text-white px-8 py-3 rounded-lg text-lg hover:bg-slate-800 transition-colors btn-transition btn-hover"
                >
                  进入创作
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-slate-700 text-white px-8 py-3 rounded-lg text-lg hover:bg-slate-800 transition-colors btn-transition btn-hover"
                >
                  立即注册
                </Link>
              )}
              <Link
                to="/about"
                className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg text-lg hover:bg-slate-50 transition-colors btn-transition"
              >
                了解更多
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
