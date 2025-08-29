import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { getNovelById, getNovelChapters, createChapter } from '../services/novelAPI';
import { IconAlertCircle, IconCheck, IconX, IconFileText, IconPlus, IconMinus } from '@tabler/icons-react';

const CreateChapterPage = () => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  // 章节表单状态
  const [chapterForm, setChapterForm] = useState({
    title: '',
    content: '',
    parentChapterId: null,
    chapterType: 'normal'
  });

  useEffect(() => {
    if (novelId) {
      fetchNovelDetails();
      fetchChapters();

      // 从URL参数读取父章节ID
      const parentChapterId = searchParams.get('parentChapterId');
      if (parentChapterId) {
        setChapterForm(prev => ({
          ...prev,
          parentChapterId: parentChapterId
        }));
      }
    }
  }, [novelId, searchParams]);

  // 获取小说详情
  const fetchNovelDetails = async () => {
    try {
      const result = await getNovelById(novelId);
      if (result.success) {
        setNovel(result.novel);
      } else {
        setError(result.message || '获取小说详情失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }
  };

  // 获取章节列表
  const fetchChapters = async () => {
    try {
      const result = await getNovelChapters(novelId);
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

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 特殊处理parentChapterId，空字符串转换为null
    if (name === 'parentChapterId') {
      setChapterForm(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }));
    } else {
      setChapterForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 显示发布弹窗
  const handleShowPublishModal = () => {
    if (!chapterForm.title.trim() || !chapterForm.content.trim()) {
      setError('请填写章节标题和内容');
      return;
    }
    setError('');
    setShowPublishModal(true);
  };

  // 确认发布章节
  const handleConfirmPublish = async () => {
    try {
      setSaving(true);
      setPublishResult(null);

      const result = await createChapter(novelId, chapterForm);
      setPublishResult(result);

      if (result.success) {
        // 发布成功，3秒后自动跳转
        setTimeout(() => {
          navigate(`/novel/${novelId}`);
        }, 3000);
      }
    } catch (error) {
      setPublishResult({
        success: false,
        message: '网络错误，请稍后重试'
      });
    } finally {
      setSaving(false);
    }
  };

  // 关闭发布弹窗
  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setPublishResult(null);
  };

  // 获取章节类型中文名称
  const getChapterTypeName = (type) => {
    const typeMap = {
      'normal': '普通章节',
      'ending': '结局章节',
      'tail_connection': '尾接章节'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            <p className="mt-2 text-slate-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">加载失败</h3>
            <p className="text-slate-500 mb-4">{error || '小说不存在或已被删除'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 检查权限
  const isAuthor = novel.author?.id === user?.id;
  const canParticipate = !isAuthor && novel.novel_type !== 'traditional' && novel.novel_type !== 'author_original';

  if (!isAuthor && !canParticipate) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            <p className="text-red-600 font-medium">无权限访问</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/novel/${novelId}`}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← 返回小说
              </Link>
              <h1 className="text-2xl font-bold text-slate-800 mt-2">
                {isAuthor ? '创建新章节' : '参与创作'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isAuthor ? `为《${novel.title}》添加新内容` : `为《${novel.title}》创作分支章节`}
              </p>
            </div>

          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 写作区域 */}
        <div className="bg-white border border-slate-200 rounded-lg">
          {/* 功能项区域 */}
          <div className="p-4 border-b border-slate-200">
            {/* 参与创作提示 */}
            {!isAuthor && canParticipate && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <IconFileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" stroke={1.8} />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">参与创作模式</p>
                    <p className="text-blue-600">
                      {novel.novel_type === 'mountain_beyond_mountain'
                        ? '山外有山模式：您只能在小说作者的章节或自己创建的章节上新建分支章节。'
                        : '无限点模式：您可以在任意章节上创建分支章节。'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">父章节:</span>
                <select
                  name="parentChapterId"
                  value={chapterForm.parentChapterId || ''}
                  onChange={handleInputChange}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* 只有当小说不存在根章节时才显示"无（根章节）"选项 */}
                  {!chapters.some(chapter => !chapter.parent_chapter_id) && (
                    <option value="">无（根章节）</option>
                  )}
                  {chapters.map(chapter => {
                    // 根据小说类型和用户权限过滤可选择的父章节
                    let canSelect = true;
                    let reason = '';

                    if (!isAuthor) {
                      if (novel.novel_type === 'mountain_beyond_mountain') {
                        // 山外有山模式：只能在作者章节或自己章节上创建
                        canSelect = chapter.author_id === novel.author?.id || chapter.author_id === user?.id;
                        if (!canSelect) {
                          reason = ' (仅限作者章节或自己章节)';
                        }
                      }
                      // 无限点模式：可以在任意章节上创建，无需额外限制
                    }

                    return (
                      <option
                        key={chapter.id}
                        value={chapter.id}
                        disabled={!canSelect}
                      >
                        {chapter.title}
                        {reason}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">类型:</span>
                <select
                  name="chapterType"
                  value={chapterForm.chapterType}
                  onChange={handleInputChange}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">普通章节</option>
                  <option value="ending" disabled>结局章节（暂不可选）</option>
                  <option value="tail_connection" disabled>尾接章节（暂不可选）</option>
                </select>
              </div>
            </div>
          </div>

          {/* 标题区域 */}
          <div className="p-6 border-b border-slate-200">
            <input
              type="text"
              name="title"
              value={chapterForm.title}
              onChange={handleInputChange}
              placeholder="请输入章节标题"
              className="w-full text-2xl font-bold text-slate-800 border-none outline-none focus:ring-0 placeholder-slate-400"
            />
          </div>

          {/* 正文区域 */}
          <div className="p-6">
            <textarea
              name="content"
              value={chapterForm.content}
              onChange={handleInputChange}
              placeholder="开始你的创作..."
              rows={20}
              className="w-full text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400 resize-none text-lg leading-relaxed"
            />
          </div>
        </div>

        {/* 页面底部操作栏 */}
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              字数：{chapterForm.content.length}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/novel/${novelId}`)}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleShowPublishModal}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAuthor ? '发布章节' : '发布分支'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 发布弹窗 */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {!publishResult ? (
              // 发布确认弹窗
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <IconCheck className="w-8 h-8 text-blue-600" stroke={1.8} />
                  </div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">确认发布章节</h3>
                  <p className="text-slate-600">确定要发布《{chapterForm.title}》吗？发布后将无法修改。</p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleClosePublishModal}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmPublish}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? '发布中...' : '确认发布'}
                  </button>
                </div>
              </>
            ) : (
              // 发布结果弹窗
              <>
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${publishResult.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {publishResult.success ? (
                      <IconCheck className="w-8 h-8 text-green-600" stroke={1.8} />
                    ) : (
                      <IconX className="w-8 h-8 text-red-600" stroke={1.8} />
                    )}
                  </div>
                  <h3 className={`text-xl font-medium mb-2 ${publishResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {publishResult.success ? '发布成功！' : '发布失败'}
                  </h3>
                  <p className="text-slate-600">
                    {publishResult.message}
                  </p>
                  {publishResult.success && (
                    <p className="text-sm text-slate-500 mt-2">3秒后自动跳转到小说页面</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  {!publishResult.success && (
                    <button
                      onClick={handleClosePublishModal}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      关闭
                    </button>
                  )}
                  {publishResult.success && (
                    <button
                      onClick={() => navigate(`/novel/${novelId}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      立即跳转
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateChapterPage;
