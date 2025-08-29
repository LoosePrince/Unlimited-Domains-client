import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { getCommunityHome } from '../services/communityAPI';
import UserAvatar from '../components/UserAvatar';
import { 
  IconThumbUp, 
  IconMessageCircle, 
  IconStar, 
  IconPlus, 
  IconClock, 
  IconTrendingUp,
  IconHeart,
  IconBookmark,
  IconSparkles
} from '@tabler/icons-react';

const Section = ({ title, items, icon, gradient }) => {
  if (!items || items.length === 0) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-xl border border-slate-200 shadow-sm`}>
        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -translate-y-12 md:-translate-y-16 translate-x-12 md:translate-x-16"></div>
        <div className="relative p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-white/60 backdrop-blur-sm rounded-lg">
              {icon}
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
          </div>
          <div className="text-center py-6 md:py-8">
            <div className="text-slate-600 text-xs md:text-sm">暂无文章</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300`}>
      {/* 装饰性背景元素 */}
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -translate-y-12 md:-translate-y-16 translate-x-12 md:translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full translate-y-8 md:translate-y-12 -translate-x-8 md:-translate-x-12"></div>
      
      <div className="relative p-4 md:p-6">
        {/* 区块标题 */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-white/60 backdrop-blur-sm rounded-lg">
            {icon}
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
          <div className="ml-auto">
            <div className="text-slate-600 text-xs bg-white/60 px-2 py-1 rounded-full">
              {items.length} 篇
            </div>
          </div>
        </div>

        {/* 文章列表 */}
        <div className="space-y-3 md:space-y-4">
          {items.map((item, index) => (
            <Link 
              key={item.id} 
              to={`/community/articles/${item.id}`} 
              className="block group"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 md:p-4 hover:bg-white hover:shadow-md transition-all duration-200 border border-white/20">
                <div className="flex gap-2 md:gap-4">
                  {/* 序号和封面 */}
                  <div className="flex-shrink-0 flex items-start gap-1.5 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    {item.cover_image_url && (
                      <div className="relative">
                        <img 
                          src={item.cover_image_url} 
                          alt={item.title}
                          className="w-16 h-11 md:w-28 md:h-20 object-cover rounded-md border border-slate-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* 文章信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-slate-800 font-semibold group-hover:text-blue-600 line-clamp-2 text-xs md:text-sm leading-4 md:leading-5 flex-1 mr-2">
                        {item.title}
                      </h4>
                      <div className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                        <IconClock className="w-3 h-3" stroke={1.5} />
                        {new Date(item.created_at).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-600 mb-2 md:mb-3 line-clamp-2 leading-4">
                      {item.excerpt}
                    </div>
                    
                    {/* 作者信息 */}
                    {item.author_username && (
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/profile/${item.author_id}`}
                          className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1.5 md:gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UserAvatar 
                            user={{ 
                              id: item.author_id, 
                              username: item.author_username, 
                              avatar_url: item.author_avatar_url 
                            }} 
                            size="xs" 
                          />
                          <span className="truncate">{item.author_username}</span>
                        </Link>
                        
                        {/* 统计数据 */}
                        <div className="flex items-center gap-2 md:gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <IconHeart className="w-3 h-3" stroke={1.5} />
                            {item.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconMessageCircle className="w-3 h-3" stroke={1.5} />
                            {item.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconBookmark className="w-3 h-3" stroke={1.5} />
                            {item.favorites}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* 查看更多 */}
        {items.length >= 5 && (
          <div className="mt-3 md:mt-4 text-center">
            <button className="text-slate-600 hover:text-slate-800 text-xs md:text-sm font-medium py-1.5 md:py-2 px-3 md:px-4 bg-white/60 hover:bg-white/80 rounded-lg transition-colors duration-200">
              查看更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sections, setSections] = useState({ recent: [], popular: [], most_favorited: [], most_liked: [] });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await getCommunityHome();
      if (result.success) {
        setSections(result.sections);
      } else {
        setError(result.message || '加载失败');
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <Navigation />
      
      {/* 英雄区域 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-200">
        <div className="absolute inset-0 bg-white/40"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <IconSparkles className="w-6 h-6 md:w-8 md:h-8 text-slate-600" stroke={1.5} />
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  社区广场
                </h1>
              </div>
              <p className="text-slate-600 text-base md:text-lg mb-4 md:mb-6 max-w-2xl">
                分享你的创作心得，探索优秀作品，与志同道合的创作者交流互动
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 text-slate-600 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <IconClock className="w-3 h-3 md:w-4 md:h-4" stroke={1.5} />
                  <span>实时更新</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <IconTrendingUp className="w-3 h-3 md:w-4 md:h-4" stroke={1.5} />
                  <span>热门推荐</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <IconHeart className="w-3 h-3 md:w-4 md:h-4" stroke={1.5} />
                  <span>精选内容</span>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <Link 
                to="/community/create" 
                className="group relative inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                <IconPlus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-300" stroke={2} />
                <span>发布文章</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 md:py-20">
            <div className="relative inline-block">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <IconSparkles className="w-4 h-4 md:w-6 md:h-6 text-blue-600 animate-pulse" stroke={1.5} />
              </div>
            </div>
            <p className="mt-3 md:mt-4 text-slate-600 font-medium text-sm md:text-base">加载精彩内容中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Section 
              title="近期文章" 
              items={sections.recent || []} 
              icon={<IconClock className="w-5 h-5 text-slate-700" stroke={1.5} />}
              gradient="from-emerald-100 to-teal-200"
            />
            <Section 
              title="热门文章" 
              items={sections.popular || []} 
              icon={<IconTrendingUp className="w-5 h-5 text-slate-700" stroke={1.5} />}
              gradient="from-orange-100 to-red-200"
            />
            <Section 
              title="最多收藏" 
              items={sections.most_favorited || []} 
              icon={<IconBookmark className="w-5 h-5 text-slate-700" stroke={1.5} />}
              gradient="from-purple-100 to-pink-200"
            />
            <Section 
              title="最多点赞" 
              items={sections.most_liked || []} 
              icon={<IconHeart className="w-5 h-5 text-slate-700" stroke={1.5} />}
              gradient="from-blue-100 to-cyan-200"
            />
          </div>
        )}

        {/* 底部装饰 */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 text-slate-600 text-xs md:text-sm">
            <IconSparkles className="w-3 h-3 md:w-4 md:h-4" stroke={1.5} />
            <span>探索更多精彩内容</span>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CommunityPage;


