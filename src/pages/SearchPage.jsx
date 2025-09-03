import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { searchNovels } from '../services/novelAPI';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import { IconFileText, IconSearch, IconUser, IconCalendarClock } from '@tabler/icons-react';
import FollowButton from '../components/FollowButton';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [novels, setNovels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchType, setSearchType] = useState('novels'); // 仍保留切换，仅控制UI高亮
  const navigate = useNavigate();
  const lastFetchRef = useRef({ q: '', ts: 0 });

  // 从URL参数获取搜索词
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  // 执行搜索
  const performSearch = async (query) => {
    if (!query.trim()) return;

    const now = Date.now();
    if (lastFetchRef.current.q === query && now - lastFetchRef.current.ts < 500) {
      return;
    }
    lastFetchRef.current = { q: query, ts: now };

    setLoading(true);
    try {
      // 统一调用综合搜索接口
      const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const result = await resp.json();
      if (result.success) {
        setNovels(result.novels || []);
        setTotalResults(result.novelsTotal || 0);
        setUsers(result.users || []);
        setTotalUsers(result.usersTotal || 0);

        // 如果只有用户有搜索结果，自动切换到用户页
        const novelsCount = result.novelsTotal || 0;
        const usersCount = result.usersTotal || 0;
        if (novelsCount === 0 && usersCount > 0) {
          setSearchType('users');
        }
      } else {
        setNovels([]);
        setTotalResults(0);
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setNovels([]);
      setTotalResults(0);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };



  // 高亮搜索词
  const highlightText = (text, query) => {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : (
        part
      )
    );
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
        {/* 搜索框 */}
        <div className="mb-6 md:mb-8">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === 'novels' ? "搜索书名、简介、作者、标签..." : "搜索用户名、简介..."}
                className="w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 md:px-6 py-1.5 md:py-2 bg-blue-600 text-white text-sm md:text-base rounded-full hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
          
          {/* 搜索类型切换 */}
          <div className="flex justify-center mt-4">
            <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setSearchType('novels')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchType === 'novels'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <IconFileText className="w-4 h-4 inline mr-2" />
                小说
              </button>
              <button
                onClick={() => setSearchType('users')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchType === 'users'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <IconUser className="w-4 h-4 inline mr-2" />
                用户
              </button>
            </div>
          </div>
        </div>

        {/* 搜索结果 */}
        {searchQuery && (
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              搜索结果
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              找到 {searchType === 'novels' ? totalResults : totalUsers} 个相关{searchType === 'novels' ? '小说' : '用户'}
              {searchQuery && ` · 搜索词："${searchQuery}"`}
            </p>
          </div>
        )}

        {/* 搜索提示 */}
        {!searchQuery && (
          <div className="text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <IconSearch className="w-8 h-8 md:w-12 md:h-12 text-gray-400" stroke={1.8} />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">开始搜索</h3>
            <p className="text-sm md:text-base text-gray-500 px-4">
              在搜索框中输入关键词，搜索{searchType === 'novels' ? '书名、简介、作者或标签' : '用户名或简介'}
            </p>
          </div>
        )}

        {/* 搜索结果列表 */}
        {searchQuery && (
          <>
            {loading ? (
              // 加载状态 - 与新的统一横向布局保持一致
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="flex gap-3 md:gap-4">
                      {/* 封面骨架 - 响应式尺寸 */}
                      <div className="flex-shrink-0 p-2 md:p-3">
                        <div className="w-20 h-28 md:w-32 md:h-40 bg-gray-200 rounded-lg"></div>
                      </div>
                      {/* 内容骨架 */}
                      <div className="flex-1 p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2 md:mb-3">
                          <div className="h-4 md:h-6 bg-gray-200 rounded flex-1 mr-2 md:mr-3"></div>
                          <div className="w-16 h-5 bg-gray-200 rounded flex-shrink-0"></div>
                        </div>
                        <div className="flex items-center mb-2 md:mb-3">
                          <div className="w-20 h-3 md:h-4 bg-gray-200 rounded mr-2"></div>
                          <div className="w-3 h-3 md:h-4 bg-gray-200 rounded mx-2"></div>
                          <div className="w-24 h-3 md:h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-3 md:h-4 bg-gray-200 rounded mb-3 md:mb-4"></div>
                        <div className="h-3 md:h-4 bg-gray-200 rounded mb-3 md:mb-4 w-3/4"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="w-32 h-3 md:h-4 bg-gray-200 rounded"></div>
                          <div className="w-24 h-3 md:h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (searchType === 'novels' ? novels.length > 0 : users.length > 0) ? (
              // 显示搜索结果
              searchType === 'novels' ? (
                // 小说搜索结果
                <div className="space-y-4">
                  {novels.map((novel) => (
                    <button
                      key={novel.id}
                      onClick={() => goToNovelDetail(novel.id)}
                      className="text-left block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
                    >
                      {/* 统一横向布局：左侧封面，右侧信息 */}
                      <div className="flex">
                        {/* 封面区域 - 响应式尺寸 */}
                        <div className="flex-shrink-0 p-2 md:p-3">
                          <NovelCoverAdvanced
                            title={novel.title}
                            author={novel.author_username || '未知'}
                            theme="default"
                            coverUrl={novel.cover_image_url}
                            className="w-20 h-40 md:w-32 md:h-40"
                          />
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 p-3 md:p-4 min-w-0">
                          {/* 标题和章节数 */}
                          <div className="flex items-start justify-between mb-2 md:mb-3">
                            <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2 md:mr-3">
                              {highlightText(novel.title, searchQuery)}
                            </h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                              {novel.total_chapters || novel.totalChapters || 0}章
                            </span>
                          </div>

                          {/* 标签和类型 */}
                          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                            <span className="mr-2">
                              {novel.tags && novel.tags.length > 0 ? novel.tags[0] : '未分类'}
                            </span>
                            <span>·</span>
                            <span className="ml-2">{getNovelTypeName(novel.novel_type)}</span>
                          </div>

                          {/* 简介 */}
                          <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 leading-relaxed">
                            {novel.description ? highlightText(novel.description, searchQuery) : '暂无描述...'}
                          </p>

                          {/* 作者和更新时间 */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm text-gray-500 gap-1 sm:gap-0">
                            <span className="truncate">
                              作者：
                              {novel.author_id ? (
                                <Link
                                  to={`/profile/${novel.author_id}`}
                                  className="text-gray-600 hover:text-gray-800 font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {highlightText(novel.author_username || '未知', searchQuery)}
                                </Link>
                              ) : (
                                highlightText(novel.author_username || '未知', searchQuery)
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <IconCalendarClock className="w-3 h-3 md:w-4 md:h-4" stroke={1.5} />
                              {new Date(novel.updated_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* 标签高亮 */}
                          {novel.tags && novel.tags.length > 0 && (
                            <div className="mt-2 md:mt-3 flex flex-wrap gap-1 md:gap-2">
                              {novel.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                >
                                  {highlightText(tag, searchQuery)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // 用户搜索结果
                <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 p-6"
                    >
                      {/* 用户头像 */}
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {user.username?.[0]?.toUpperCase() || '用'}
                        </div>
                      </div>

                      {/* 用户信息 */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          <Link to={`/profile/${user.id}`} className="hover:text-gray-700">
                            {highlightText(user.username, searchQuery)}
                          </Link>
                        </h3>
                        {user.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {highlightText(user.bio, searchQuery)}
                          </p>
                        )}
                      </div>

                      {/* 用户统计 */}
                      <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-4">
                        <span>声望: {user.reputation || 0}</span>
                        <span>注册: {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* 关注按钮 */}
                      <div className="flex justify-center">
                        <FollowButton 
                          targetUserId={user.id} 
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // 无搜索结果
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconFileText className="w-12 h-12 text-gray-400" stroke={1.8} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关结果</h3>
                <p className="text-gray-500">
                  没有找到包含"{searchQuery}"的相关内容
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>搜索提示：</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 尝试使用更简单的关键词</li>
                    <li>• 检查拼写是否正确</li>
                    <li>• 尝试搜索作者名或标签</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
