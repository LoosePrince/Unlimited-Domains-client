import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../components/Modal';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import FollowButton from '../components/FollowButton';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import AvatarUpload from '../components/AvatarUpload';
import UserAvatar from '../components/UserAvatar';
import { userAPI } from '../services/userAPI';
import { authAPI } from '../services/authAPI';

import {
  IconUser,
  IconMail,
  IconCalendarClock,
  IconTrophy,
  IconUsers,
  IconHeart,
  IconBook2,
  IconFileText,
  IconStar,
  IconBookmark,
  IconHistory,
  IconRoute,
  IconEye,
  IconThumbUp,
  IconMessageCircle,
  IconBooks,
  IconChevronRight,
  IconLoader,
  IconDevices,
  IconX,
  IconShield
} from '@tabler/icons-react';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const modal = useModal();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('novels');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 内容数据
  const [novels, setNovels] = useState([]);
  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [readingPaths, setReadingPaths] = useState([]);
  const [comments, setComments] = useState([]);
  const [sessions, setSessions] = useState([]);

  
  // 分页信息
  const [pagination, setPagination] = useState({});
  const [contentLoading, setContentLoading] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // 是否为本人资料或站长查看
  const isOwnProfile = isAuthenticated && currentUser?.id === userId;
  const canViewPrivateTabs = isOwnProfile || (isAuthenticated && isAdmin);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (user) {
      fetchTabContent(activeTab);
    }
  }, [activeTab, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // 如果是登录用户，检查是否为站长
      if (isAuthenticated && currentUser) {
        try {
          const adminResult = await userAPI.checkAdminStatus();
          setIsAdmin(adminResult.success && adminResult.isAdmin);
        } catch (error) {
          console.error('检查站长权限失败:', error);
          setIsAdmin(false);
        }
      }

      const result = await userAPI.getUserProfile(userId);

      if (result.success) {
        setUser(result.user);
        setStats(result.stats);
        setError(null);
      } else {
        setError(result.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setError('获取用户信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabContent = async (tab, page = 1) => {
    try {
      setContentLoading(true);
      let result = {};
      
      switch (tab) {
        case 'novels':
          result = await userAPI.getUserNovels(userId, page);
          if (result.success) {
            setNovels(result.novels || []);
            setPagination(result.pagination || {});
          }
          break;
          
        case 'articles':
          result = await userAPI.getUserArticles(userId, page);
          if (result.success) {
            setArticles(result.articles || []);
            setPagination(result.pagination || {});
          }
          break;
          
        case 'favorites':
          if (!canViewPrivateTabs) return;
          result = await userAPI.getUserFavorites(userId, page);
          if (result.success) {
            setFavorites(result.favorites || []);
            setPagination(result.pagination || {});
          }
          break;

        case 'bookmarks':
          if (!canViewPrivateTabs) return;
          result = await userAPI.getUserBookmarks(userId, page);
          if (result.success) {
            setBookmarks(result.bookmarks || []);
            setPagination(result.pagination || {});
          }
          break;

        case 'history':
          if (!canViewPrivateTabs) return;
          result = await userAPI.getUserReadingHistory(userId, page);
          if (result.success) {
            setReadingHistory(result.history || []);
            setPagination(result.pagination || {});
          }
          break;

        case 'paths':
          if (!canViewPrivateTabs) return;
          result = await userAPI.getUserReadingPaths(userId, page);
          if (result.success) {
            setReadingPaths(result.readingPaths || []);
            setPagination(result.pagination || {});
          }
          break;

        case 'comments':
          if (!canViewPrivateTabs) return;
          result = await userAPI.getUserComments(userId, page);
          if (result.success) {
            setComments(result.comments || []);
            setPagination(result.pagination || {});
          }
          break;
          
        case 'sessions':
          if (!isOwnProfile) return;
          result = await authAPI.getSessions();
          if (result.success) {
            setSessions(result.data.sessions || []);
            setPagination({}); // 会话不需要分页
          }
          break;
      }
    } catch (error) {
      console.error('获取内容失败:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 下线登录会话
  const handleDeleteSession = async (sessionId) => {
    try {
      const result = await authAPI.deleteSession(sessionId);
      if (result.success) {
        // 重新获取会话列表
        fetchTabContent('sessions');
      } else {
        modal.showError({
          title: '下线失败',
          message: result.message || '下线失败，请稍后重试'
        });
      }
    } catch (error) {
      console.error('下线会话失败:', error);
      modal.showError({
        title: '网络错误',
        message: '网络连接失败，请检查网络后重试'
      });
    }
  };

  // 显示删除确认对话框
  const showDeleteSessionConfirm = (sessionId) => {
    modal.showConfirm({
      type: 'warning',
      title: '下线登录会话',
      message: '确定要下线这个登录会话吗？下线后，该设备将需要重新登录。这个操作不可撤销。',
      confirmText: '确定下线',
      cancelText: '取消',
      closable: false,
      onConfirm: () => handleDeleteSession(sessionId)
    });
  };

  // 获取设备类型显示名称
  const getDeviceTypeName = (deviceInfo) => {
    if (!deviceInfo) return '未知设备';
    
    const userAgent = deviceInfo.userAgent || '';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return '手机';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return '平板';
    } else {
      return '桌面';
    }
  };

  // 获取浏览器名称
  const getBrowserName = (deviceInfo) => {
    if (!deviceInfo || !deviceInfo.userAgent) return '未知浏览器';
    
    const userAgent = deviceInfo.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return '未知浏览器';
  };

  const getNovelTypeName = (type) => {
    const typeMap = {
      'author_original': '作者独创',
      'mountain_beyond_mountain': '山外有山',
      'infinite_point': '无限点',
      'traditional': '传统'
    };
    return typeMap[type] || type;
  };

  const renderUserAvatar = () => {
    const avatarElement = user?.avatar_url && user.avatar_url !== 'none' ? (
      <img
        src={user.avatar_url}
        alt={user.username}
        className="w-24 h-24 rounded-full object-cover"
      />
    ) : (
      <div className="w-24 h-24 bg-slate-300 rounded-full flex items-center justify-center">
        <span className="text-2xl text-slate-600">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      </div>
    );

    // 如果是本人资料，添加点击事件
    if (isOwnProfile) {
      return (
        <button
          onClick={() => setShowAvatarUpload(true)}
          className="group relative cursor-pointer transition-transform hover:scale-105"
          title="点击更换头像"
        >
          {avatarElement}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <IconUser className="w-8 h-8 text-white" stroke={2} />
            </div>
          </div>
        </button>
      );
    }

    return avatarElement;
  };

  const renderTabContent = () => {
    if (contentLoading) {
      return (
        <div className="flex justify-center py-12">
          <IconLoader className="w-8 h-8 animate-spin text-slate-400" stroke={1.8} />
        </div>
      );
    }

    switch (activeTab) {
      case 'novels':
        return renderNovels();
      case 'articles':
        return renderArticles();
      case 'favorites':
        return renderFavorites();
      case 'bookmarks':
        return renderBookmarks();
      case 'history':
        return renderReadingHistory();
      case 'paths':
        return renderReadingPaths();
      case 'comments':
        return renderComments();
      case 'sessions':
        return renderSessions();
      default:
        return null;
    }
  };

  const renderNovels = () => {
    if (novels.length === 0) {
      return (
        <div className="text-center py-12">
          <IconBooks className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有发布小说</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {novels.map((novel) => (
          <Link
            key={novel.id}
            to={`/novel/${novel.id}`}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex">
              <div className="flex-shrink-0 p-3">
                <NovelCoverAdvanced
                  title={novel.title}
                  author={user?.username || ''}
                  theme="default"
                  coverUrl={novel.cover_image_url}
                  className="w-20 h-40"
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {getNovelTypeName(novel.novel_type)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {novel.total_chapters || 0}章
                  </span>
                </div>
                <h3 className="font-medium text-slate-700 mb-2 line-clamp-1">
                  {novel.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {novel.description || '暂无描述...'}
                </p>
                <div className="flex items-center text-xs text-slate-500 space-x-4">
                  <span className="flex items-center gap-1">
                    <IconEye className="w-3 h-3" stroke={1.8} />
                    {novel.total_views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconThumbUp className="w-3 h-3" stroke={1.8} />
                    {novel.total_likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconStar className="w-3 h-3" stroke={1.8} />
                    {novel.total_favorites || 0}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderArticles = () => {
    if (articles.length === 0) {
      return (
        <div className="text-center py-12">
          <IconFileText className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有发布文章</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/community/articles/${article.id}`}
            className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-slate-700 line-clamp-1 flex-1">
                {article.title}
              </h3>
              <span className="text-sm text-slate-500 ml-4">
                {formatDate(article.created_at)}
              </span>
            </div>
            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
              {article.excerpt}...
            </p>
            <div className="flex items-center text-sm text-slate-500 space-x-4">
              <span className="flex items-center gap-1">
                <IconThumbUp className="w-4 h-4" stroke={1.8} />
                {article.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <IconMessageCircle className="w-4 h-4" stroke={1.8} />
                {article.comment_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <IconStar className="w-4 h-4" stroke={1.8} />
                {article.favorite_count || 0}
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderFavorites = () => {
    if (favorites.length === 0) {
      return (
        <div className="text-center py-12">
          <IconHeart className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有收藏内容</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {favorites.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={item.type === 'novel' ? `/novel/${item.id}` : `/community/articles/${item.id}`}
            className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.type === 'novel' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.type === 'novel' ? '小说' : '文章'}
                </span>
                <h3 className="font-medium text-slate-700 line-clamp-1">
                  {item.title}
                </h3>
              </div>
              <span className="text-sm text-slate-500">
                收藏于 {formatDate(item.favorited_at)}
              </span>
            </div>
            <p className="text-slate-600 text-sm line-clamp-2 mb-3">
              {item.description || '暂无描述...'}
            </p>
            <div className="text-sm text-slate-500">
              作者：{item.author_name}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderBookmarks = () => {
    if (bookmarks.length === 0) {
      return (
        <div className="text-center py-12">
          <IconBookmark className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有书签</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <Link
            key={bookmark.bookmark_id}
            to={`/novel/${bookmark.novel_id}/read/${bookmark.chapter_id}`}
            className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-slate-700 line-clamp-1 flex-1">
                {bookmark.novel_title}
              </h3>
              <span className="text-sm text-slate-500 ml-4">
                {formatDate(bookmark.bookmarked_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-600">
                第{bookmark.chapter_order}章：{bookmark.chapter_title}
              </span>
            </div>
            {bookmark.note && (
              <p className="text-sm text-slate-600 italic">
                备注：{bookmark.note}
              </p>
            )}
            <div className="text-sm text-slate-500 mt-2">
              作者：{bookmark.author_name}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderReadingHistory = () => {
    if (readingHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <IconHistory className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有阅读历史</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {readingHistory.map((record, index) => (
          <Link
            key={`${record.novel_id}-${record.chapter_id}-${index}`}
            to={`/novel/${record.novel_id}/read/${record.chapter_id}`}
            className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-slate-700 line-clamp-1 flex-1">
                {record.novel_title}
              </h3>
              <span className="text-sm text-slate-500 ml-4">
                {formatDate(record.read_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-600">
                第{record.chapter_order}章：{record.chapter_title}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>作者：{record.author_name}</span>
              {record.reading_duration && (
                <span>阅读时长：{Math.floor(record.reading_duration / 60)}分钟</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderReadingPaths = () => {
    if (readingPaths.length === 0) {
      return (
        <div className="text-center py-12">
          <IconRoute className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有创建阅读线</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {readingPaths.map((path) => (
          <div
            key={path.id}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  path.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {path.is_public ? '公开' : '私有'}
                </span>
                <h3 className="font-medium text-slate-700">
                  {path.name}
                </h3>
              </div>
              <span className="text-sm text-slate-500">
                {formatDate(path.updated_at)}
              </span>
            </div>
            <p className="text-slate-600 text-sm mb-3">
              {path.description || '暂无描述'}
            </p>
            <div className="text-sm text-slate-600 mb-3">
              小说：{path.novel_title} - {path.author_name}
            </div>
            <div className="flex items-center text-sm text-slate-500 space-x-4">
              <span>{path.total_chapters || 0}章</span>
              <span>{Math.floor((path.total_words || 0) / 1000)}k字</span>
              <span>{path.follower_count || 0}人使用</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <div className="text-center py-12">
          <IconMessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">还没有评论</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
          >
            {/* 评论内容 */}
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <UserAvatar
                    user={{
                      id: comment.user_id,
                      username: comment.user_username,
                      avatar_url: comment.user_avatar_url
                    }}
                    size="sm"
                    className="w-10 h-10"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <span className="font-medium">{comment.user_username}</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>

            {/* 评论目标信息 */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    comment.target_type === 'novel' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {comment.target_type === 'novel' ? '小说章节' : '社区文章'}
                  </span>
                  <span className="text-sm text-slate-600">
                    {comment.target_title}
                  </span>
                </div>
                <Link
                  to={comment.target_type === 'novel' 
                    ? `/novel/${comment.novel_id}/read/${comment.chapter_id}`
                    : `/community/articles/${comment.article_id}`
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  查看原文
                </Link>
              </div>
              
              {/* 如果是小说评论，显示章节信息 */}
              {comment.target_type === 'novel' && comment.chapter_title && (
                <div className="text-xs text-slate-500 mt-1">
                  第{comment.chapter_order}章：{comment.chapter_title}
                </div>
              )}
              
              {/* 如果是回复评论，显示回复信息 */}
              {comment.parent_comment_id && (
                <div className="text-xs text-slate-500 mt-1">
                  回复 @{comment.parent_username} 的评论
                </div>
              )}
            </div>

            {/* 评论统计 */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <IconThumbUp className="w-3 h-3" stroke={1.8} />
                {comment.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <IconMessageCircle className="w-3 h-3" stroke={1.8} />
                {comment.reply_count || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSessions = () => {
    if (sessions.length === 0) {
      return (
        <div className="text-center py-12">
          <IconDevices className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
          <p className="text-slate-500">没有活跃的登录会话</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`bg-white rounded-xl p-6 shadow-sm border ${
              session.is_current ? 'border-blue-200 bg-blue-50' : 'border-slate-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <IconDevices className="w-5 h-5 text-slate-500" stroke={1.8} />
                    <span className="font-medium text-slate-700">
                      {getDeviceTypeName(session.device_info)}
                    </span>
                  </div>
                  {session.is_current && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      当前会话
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">浏览器：</span>
                    <span className="ml-1">{getBrowserName(session.device_info)}</span>
                  </div>
                  
                  {session.device_info?.ip && (
                    <div>
                      <span className="font-medium">IP地址：</span>
                      <span className="ml-1">{session.device_info.ip}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">登录时间：</span>
                    <span className="ml-1">{formatDate(session.created_at)}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">最后活跃：</span>
                    <span className="ml-1">{formatDate(session.updated_at || session.created_at)}</span>
                  </div>
                </div>
                
                {session.device_info?.userAgent && (
                  <div className="mt-3 text-xs text-slate-500">
                    <span className="font-medium">用户代理：</span>
                    <span className="ml-1 break-all">{session.device_info.userAgent}</span>
                  </div>
                )}
              </div>
              
              {!session.is_current && (
                <button
                  onClick={() => showDeleteSessionConfirm(session.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  title="下线这个会话"
                >
                  <IconX className="w-4 h-4" stroke={1.8} />
                  下线
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <IconUser className="w-16 h-16 text-slate-300 mx-auto mb-4" stroke={1.8} />
            <h1 className="text-2xl font-bold text-slate-700 mb-2">用户不存在</h1>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0">
              {renderUserAvatar()}
            </div>
            
            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-700 mb-1">
                    {user?.username}
                  </h1>
                  <p className="text-slate-500 text-sm">ID: {user?.id}</p>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  {/* 后台管理按钮（仅站长本人可见） */}
                  {isOwnProfile && isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <IconShield className="w-4 h-4" stroke={1.8} />
                      后台管理
                    </button>
                  )}

                  {/* 关注按钮（非本人时显示） */}
                  {!isOwnProfile && isAuthenticated && (
                    <FollowButton targetUserId={userId} />
                  )}
                </div>
              </div>
              
              {/* 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {user?.bio && (
                  <div className="sm:col-span-2">
                    <p className="text-slate-600">{user.bio}</p>
                  </div>
                )}
                
                {(isOwnProfile || (isAuthenticated && isAdmin)) && user?.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <IconMail className="w-4 h-4" stroke={1.8} />
                    <span>{user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IconCalendarClock className="w-4 h-4" stroke={1.8} />
                  <span>加入于 {formatDate(user?.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IconTrophy className="w-4 h-4" stroke={1.8} />
                  <span>声望 {user?.reputation || 0}</span>
                </div>
              </div>
              
              {/* 统计信息 */}
              {stats && (
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <IconUsers className="w-4 h-4 text-slate-500" stroke={1.8} />
                    <span className="text-slate-600">
                      关注 <span className="font-medium text-slate-700">{stats.following}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconHeart className="w-4 h-4 text-slate-500" stroke={1.8} />
                    <span className="text-slate-600">
                      粉丝 <span className="font-medium text-slate-700">{stats.followers}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBook2 className="w-4 h-4 text-slate-500" stroke={1.8} />
                    <span className="text-slate-600">
                      小说 <span className="font-medium text-slate-700">{stats.novels}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconFileText className="w-4 h-4 text-slate-500" stroke={1.8} />
                    <span className="text-slate-600">
                      文章 <span className="font-medium text-slate-700">{stats.articles}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 内容标签页 */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* 标签导航 */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('novels')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'novels'
                    ? 'border-slate-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                发布的小说
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'articles'
                    ? 'border-slate-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {isOwnProfile ? '我的文章' : '发布的文章'}
              </button>
              
              {/* 私有标签页（本人或站长可见） */}
              {canViewPrivateTabs && (
                <>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'favorites'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    收藏列表
                  </button>
                  <button
                    onClick={() => setActiveTab('bookmarks')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'bookmarks'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    书签列表
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    阅读历史
                  </button>
                  <button
                    onClick={() => setActiveTab('paths')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'paths'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    我的阅读线
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'comments'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    我的评论
                  </button>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'sessions'
                        ? 'border-slate-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    登录管理
                  </button>
                </>
              )}
            </nav>
          </div>
          
          {/* 内容区域 */}
          <div className="p-6 min-h-[400px]">
            {renderTabContent()}
          </div>
          
          {/* 分页 */}
          {pagination?.pages > 1 && (
            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchTabContent(activeTab, page)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pagination.page
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />



      {/* 头像上传组件 */}
      <AvatarUpload
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        onSuccess={(newAvatarUrl) => {
          // 更新本地用户信息
          if (user) {
            setUser({ ...user, avatar_url: newAvatarUrl });
          }
        }}
      />
    </div>
  );
};

export default ProfilePage;
