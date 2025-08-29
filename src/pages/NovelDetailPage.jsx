import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import NovelCover from '../components/NovelCover';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import { getNovelById, getNovelChapters, getReadingProgress, toggleNovelFavorite, checkNovelFavoriteStatus, getNovelStatsById } from '../services/novelAPI';
import NovelEditView from '../components/NovelEditView';
import { IconAlertCircle, IconFileText, IconEye, IconEdit } from '@tabler/icons-react';
import FollowButton from '../components/FollowButton';

const NovelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, chapters, settings
  const [chaptersMode, setChaptersMode] = useState('list'); // 'list' | 'graph'
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [novelStats, setNovelStats] = useState(null);


  useEffect(() => {
    if (id) {
      fetchNovelDetails();
      fetchChapters();
      fetchNovelStats();
    }
  }, [id]);

  // 根据小说类型设置章节默认显示模式
  useEffect(() => {
    if (novel) {
      if (novel.novel_type !== 'traditional') {
        setChaptersMode('graph');
      } else {
        setChaptersMode('list');
      }
    }
  }, [novel]);

  // 获取小说详情
  const fetchNovelDetails = async () => {
    try {
      const result = await getNovelById(id);
      if (result.success) {
        setNovel(result.novel);
        // 如果用户已登录，检查收藏状态
        if (isAuthenticated) {
          checkFavoriteStatus();
        }
      } else {
        setError(result.message || '获取小说详情失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }
  };

  // 检查收藏状态
  const checkFavoriteStatus = async () => {
    try {
      const result = await checkNovelFavoriteStatus(id);
      if (result.success) {
        setIsFavorited(result.isFavorited);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const result = await toggleNovelFavorite(id);
      if (result.success) {
        setIsFavorited(result.action === 'favorite');
        // 可以显示成功提示
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 获取章节列表
  const fetchChapters = async () => {
    try {
      const result = await getNovelChapters(id);
      if (result.success) {
        setChapters(result.chapters || []);
      } else {
        setError(result.message || '获取章节列表失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取小说统计数据
  const fetchNovelStats = async () => {
    try {
      const result = await getNovelStatsById(id);
      if (result.success) {
        setNovelStats(result.stats);
      }
    } catch (error) {
      console.error('获取小说统计数据失败:', error);
    }
  };

  // 跳转到阅读页：优先进度章节，否则首章
  const goReadNovel = async () => {
    if (!id) return;
    try {
      let targetChapterId = null;
      const progressRes = await getReadingProgress(id);
      if (progressRes && progressRes.success && progressRes.progress && progressRes.progress.current_chapter_id) {
        targetChapterId = progressRes.progress.current_chapter_id;
      }
      if (!targetChapterId) {
        if (chapters && chapters.length > 0) {
          targetChapterId = chapters[0].id;
        }
      }
      if (targetChapterId) {
        navigate(`/novel/${id}/read/${targetChapterId}`);
      }
    } catch (e) { }
  };


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

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 判断创建章节的跳转目标
  const getCreateChapterTarget = () => {
    // 检查是否存在根章节
    const hasRootChapter = chapters.some(chapter => !chapter.parent_chapter_id);

    if (!hasRootChapter) {
      // 不存在根章节，正常进入创建页面
      return `/novel/${id}/create-chapter`;
    } else if (novel.novel_type === 'traditional') {
      // 存在根章节且为传统类型，自动选择最后一个章节作为父节点
      if (chapters.length > 0) {
        // 按创建时间排序，选择最新的章节作为父节点
        const sortedChapters = [...chapters].sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
        const lastChapter = sortedChapters[0];
        return `/novel/${id}/create-chapter?parentChapterId=${lastChapter.id}`;
      } else {
        // 如果没有章节，正常进入创建页面
        return `/novel/${id}/create-chapter`;
      }
    } else {
      // 存在根章节且为非传统类型，进入编辑页的视图模式
      return `/novel/${id}/edit?tab=view`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            <p className="mt-2 text-slate-600">加载中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            <p className="text-red-600 font-medium">小说不存在或已被删除</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* 小说头部信息 */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 封面区域 */}
            <div className="flex-shrink-0">
              <NovelCoverAdvanced
                title={novel.title}
                author={novel.author?.username || '未知'}
                platform="无限域"
                theme="default"
                coverUrl={novel.cover_image_url}
                size="lg"
              />
            </div>

            {/* 小说信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">{novel.title}</h1>
                  <p className="text-slate-600 mb-4">{novel.description}</p>
                </div>
                <div className="flex space-x-2"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500">作者</p>
                  <div className="flex items-center gap-2">
                    {novel.author?.id ? (
                      <Link 
                        to={`/profile/${novel.author.id}`}
                        className="font-medium text-slate-700 hover:text-slate-900"
                      >
                        {novel.author?.username || '未知'}
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-700">{novel.author?.username || '未知'}</p>
                    )}
                    {novel.author?.id && (
                      <FollowButton 
                        targetUserId={novel.author.id} 
                        size="sm"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">类型</p>
                  <p className="font-medium text-slate-700">{getNovelTypeName(novel.novel_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  <p className="font-medium text-slate-700">{novel.status === 'published' ? '已发布' : '草稿'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p className="font-medium text-slate-700">{formatDate(novel.created_at)}</p>
                </div>
              </div>

              {novel.tags && novel.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                概览
              </button>
              <button
                onClick={() => setActiveTab('chapters')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'chapters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                章节 ({novel.total_chapters})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                设定
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-slate-700 mb-2">统计信息</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">总章节</span>
                        <span className="font-medium">{novelStats?.total_chapters || novel.total_chapters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">总字数</span>
                        <span className="font-medium">{(novelStats?.total_words || novel.total_words || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">总点赞</span>
                        <span className="font-medium">{novelStats?.total_likes || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">总评论</span>
                        <span className="font-medium">{novelStats?.total_comments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">总收藏</span>
                        <span className="font-medium">{novelStats?.total_favorites || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">分支创作</span>
                        <span className="font-medium">{novel.is_branching_enabled ? '已启用' : '未启用'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-slate-700 mb-2">阅读选项</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                        <div className="font-medium text-slate-700">推荐阅读线</div>
                        <div className="text-sm text-slate-500">作者推荐的阅读顺序</div>
                      </button>
                      {novel.novel_type !== 'traditional' && (
                        <button className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <div className="font-medium text-slate-700">热门分支</div>
                          <div className="text-sm text-slate-500">基于点赞和评论的热门选择</div>
                        </button>
                      )}
                      {isAuthenticated && novel.novel_type !== 'traditional' && (
                        <button 
                          onClick={() => navigate(`/novel/${id}/custom-reading-path`)}
                          className="w-full text-left p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="font-medium text-blue-700">自定义阅读线</div>
                          <div className="text-sm text-blue-600">创建属于您的个人阅读路径</div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 移除独立收藏区，收藏整合到快速操作 */}

                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-slate-700 mb-2">快速操作</h3>
                    <div className="space-y-3">
                      <button onClick={goReadNovel} className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        开始阅读
                      </button>
                      {novel.author?.id === user?.id && (
                        <button
                          onClick={() => navigate(`/novel/${id}/edit`)}
                          className="w-full p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          编辑小说
                        </button>
                      )}
                      {novel.author?.id === user?.id && (
                        <button
                          onClick={() => navigate(getCreateChapterTarget())}
                          className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          创建章节
                        </button>
                      )}
                      <button 
                        onClick={handleToggleFavorite}
                        disabled={favoriteLoading}
                        className={`w-full p-3 rounded-lg transition-colors ${
                          isFavorited
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isFavorited ? '取消收藏' : '收藏小说'}
                      >
                        <span className="font-medium">
                          {favoriteLoading 
                            ? '处理中...' 
                            : isFavorited 
                              ? '取消收藏' 
                              : '收藏小说'}
                        </span>
                      </button>
                      {/* 非作者且非传统/作者独创类型小说显示参与创作选项 */}
                      {isAuthenticated &&
                        user?.id !== novel.author?.id &&
                        novel.novel_type !== 'traditional' &&
                        novel.novel_type !== 'author_original' && (
                          <button
                            onClick={() => navigate(`/novel/${id}/edit?tab=view`)}
                            className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            参与创作
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <h3 className="text-xl font-medium text-slate-700">章节</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChaptersMode('graph')}
                      className={`px-3 py-1 rounded-md border text-sm transition-colors ${chaptersMode === 'graph' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      视图模式
                    </button>
                    <button
                      onClick={() => setChaptersMode('list')}
                      className={`px-3 py-1 rounded-md border text-sm transition-colors ${chaptersMode === 'list' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      列表模式
                    </button>
                    {novel.author?.id === user?.id && (
                      <Link
                        to={getCreateChapterTarget()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        创建新章节
                      </Link>
                    )}
                  </div>
                </div>

                {chaptersMode === 'graph' ? (
                  <div className="border border-slate-200 rounded-lg bg-white">
                    <div className="h-[800px]">
                      <NovelEditView novel={novel} chapters={chapters} />
                    </div>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-12">
                    <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
                    <p className="text-slate-500">暂无章节</p>
                    {novel.author?.id === user?.id && (
                      <Link
                        to={getCreateChapterTarget()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        创建章节
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chapters.map((chapter) => (
                      <button key={chapter.id} onClick={() => navigate(`/novel/${id}/read/${chapter.id}`)} className="text-left bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-slate-700 mb-2">{chapter.title}</h4>
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">{chapter.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <span>
                                作者：
                                {chapter.author_id ? (
                                  <Link 
                                    to={`/profile/${chapter.author_id}`}
                                    className="text-slate-700 hover:text-slate-900"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {chapter.author_username || '未知'}
                                  </Link>
                                ) : (
                                  chapter.author_username || '未知'
                                )}
                              </span>
                              <span>字数：{chapter.word_count?.toLocaleString() || 0}</span>
                              <span>创建于：{formatDate(chapter.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <IconEye className="w-4 h-4" stroke={1.8} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <IconEdit className="w-4 h-4" stroke={1.8} />
                            </button>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-700 mb-3">人物设定</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-line">{novel.characters || '暂无人物设定'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-700 mb-3">世界背景</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-line">{novel.world_background || '暂无世界背景设定'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-3">其他设定</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-line">{novel.other_settings || '暂无其他设定'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NovelDetailPage;
