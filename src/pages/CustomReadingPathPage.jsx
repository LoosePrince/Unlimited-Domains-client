import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../components/Modal';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
  getNovelById, 
  getChapterTree, 
  getUserCustomPath, 
  createReadingPath, 
  updateReadingPath, 
  getReadingPathDetail 
} from '../services/novelAPI';
import { IconAlertTriangle, IconAlertCircle, IconFileText, IconPlus, IconMinus, IconCheck, IconX, IconTrash, IconArrowLeft, IconClock } from '@tabler/icons-react';

const CustomReadingPathPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const modal = useModal();

  const [novel, setNovel] = useState(null);
  const [chapterTree, setChapterTree] = useState([]);
  const [customPath, setCustomPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '我的自定义阅读线',
    description: '',
    selectedPath: [] // 存储选择的路径章节
  });
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });
  const [currentBranch, setCurrentBranch] = useState(null); // 当前正在选择分支的章节

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 并行获取小说信息、章节树和用户自定义阅读线
      const [novelResult, chapterTreeResult, customPathResult] = await Promise.all([
        getNovelById(id),
        getChapterTree(id),
        getUserCustomPath(id)
      ]);

      if (!novelResult.success) {
        setError(novelResult.message || '获取小说信息失败');
        return;
      }

      if (!chapterTreeResult.success) {
        setError(chapterTreeResult.message || '获取章节结构失败');
        return;
      }

      setNovel(novelResult.novel);
      setChapterTree(chapterTreeResult.chapterTree || []);

      // 如果已有自定义阅读线，获取详情并转换为路径选择格式
      if (customPathResult.success && customPathResult.customPath) {
        setCustomPath(customPathResult.customPath);
        const pathDetail = await getReadingPathDetail(id, customPathResult.customPath.id);
        if (pathDetail.success) {
          setFormData({
            name: pathDetail.readingPath.name || '我的自定义阅读线',
            description: pathDetail.readingPath.description || '',
            selectedPath: pathDetail.readingPath.chapters ? 
              pathDetail.readingPath.chapters.map(ch => ({
                id: ch.chapter_id,
                title: ch.chapter_title,
                reason: ch.branch_choice_reason || ''
              })) : []
          });
        }
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 选择章节（路径选择模式）
  const selectChapter = (chapter, reason = '') => {
    setFormData(prev => {
      // 检查是否为路径的下一个有效选择
      if (prev.selectedPath.length === 0) {
        // 第一个章节，可以是任何根章节
        return {
          ...prev,
          selectedPath: [{
            id: chapter.id,
            title: chapter.title,
            reason: reason || '起始章节'
          }]
        };
      } else {
        // 后续章节必须是前一章节的子章节
        const lastChapter = prev.selectedPath[prev.selectedPath.length - 1];
        const parentChapter = findChapterInTree(chapterTree, lastChapter.id);
        
        if (parentChapter && parentChapter.children.some(child => child.id === chapter.id)) {
          return {
            ...prev,
            selectedPath: [...prev.selectedPath, {
              id: chapter.id,
              title: chapter.title,
              reason: reason || '路径选择'
            }]
          };
        } else {
          // 无效选择，显示错误提示
          modal.showWarning({
            title: '选择限制',
            message: '只能选择当前章节的直接后续章节'
          });
          return prev;
        }
      }
    });
    
    // 关闭分支选择对话框
    setCurrentBranch(null);
  };

  // 从路径中移除章节（只能从末尾移除）
  const removeLastChapter = () => {
    setFormData(prev => ({
      ...prev,
      selectedPath: prev.selectedPath.slice(0, -1)
    }));
  };

  // 更新章节选择理由
  const updateChapterReason = (chapterId, reason) => {
    setFormData(prev => ({
      ...prev,
      selectedPath: prev.selectedPath.map(c => 
        c.id === chapterId ? { ...c, reason } : c
      )
    }));
  };

  // 在章节树中查找章节
  const findChapterInTree = (tree, chapterId) => {
    for (const chapter of tree) {
      if (chapter.id === chapterId) {
        return chapter;
      }
      if (chapter.children && chapter.children.length > 0) {
        const found = findChapterInTree(chapter.children, chapterId);
        if (found) return found;
      }
    }
    return null;
  };

  // 获取下一步可选的章节
  const getNextOptions = () => {
    if (formData.selectedPath.length === 0) {
      // 如果还没有选择章节，返回所有根章节
      return chapterTree;
    } else {
      // 返回最后选择章节的子章节
      const lastChapter = formData.selectedPath[formData.selectedPath.length - 1];
      const parentChapter = findChapterInTree(chapterTree, lastChapter.id);
      return parentChapter ? parentChapter.children : [];
    }
  };

  // 保存阅读线
  const saveReadingPath = async () => {
    try {
      setSaving(true);
      
      if (formData.selectedPath.length === 0) {
        setSaveStatus({
          show: true,
          success: false,
          message: '请至少选择一个章节'
        });
        setSaving(false);
        return;
      }
      
      const pathData = {
        name: formData.name,
        description: formData.description,
        pathType: 'custom',
        chapters: formData.selectedPath.map(c => ({
          chapterId: c.id,
          reason: c.reason
        }))
      };

      let result;
      if (customPath) {
        // 更新现有阅读线
        result = await updateReadingPath(id, customPath.id, pathData);
      } else {
        // 创建新阅读线
        result = await createReadingPath(id, pathData);
      }

      if (result.success) {
        setSaveStatus({
          show: true,
          success: true,
          message: '阅读线保存成功！'
        });
        // 重新获取数据
        await fetchData();
      } else {
        setSaveStatus({
          show: true,
          success: false,
          message: result.message || '保存失败'
        });
      }
    } catch (error) {
      setSaveStatus({
        show: true,
        success: false,
        message: '网络错误，请稍后重试'
      });
    } finally {
      setSaving(false);
    }

    // 3秒后隐藏状态
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // 权限检查
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <IconAlertTriangle className="w-12 h-12 text-amber-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">需要登录</h3>
            <p className="text-slate-500 mb-4">请先登录才能创建自定义阅读线</p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">加载失败</h3>
            <p className="text-slate-500 mb-4">{error || '小说不存在或已被删除'}</p>
            <button
              onClick={() => navigate(`/novel/${id}`)}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              返回小说页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 传统类型小说不支持自定义阅读线
  if (novel.novel_type === 'traditional') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <IconClock className="w-12 h-12 text-slate-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">功能不可用</h3>
            <p className="text-slate-500 mb-4">传统类型小说不支持自定义阅读线功能</p>
            <button
              onClick={() => navigate(`/novel/${id}`)}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              返回小说页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                  <Link to="/" className="hover:text-slate-700">首页</Link>
                  <span>/</span>
                  <Link to={`/novel/${id}`} className="hover:text-slate-700">{novel.title}</Link>
                  <span>/</span>
                  <span className="text-slate-700">自定义阅读线</span>
                </nav>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                  {customPath ? '编辑自定义阅读线' : '创建自定义阅读线'}
                </h1>
                <p className="text-slate-600">
                  为《{novel.title}》创建专属于您的个性化阅读路径
                </p>
              </div>
              <Link
                to={`/novel/${id}`}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="w-5 h-5" stroke={1.8} />
                <span>返回小说</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 保存状态提示 */}
        {saveStatus.show && (
          <div className={`mb-6 p-4 rounded-lg border ${saveStatus.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            <div className="flex items-center space-x-2">
              {saveStatus.success ? (
                <IconCheck className="w-5 h-5" stroke={1.8} />
              ) : (
                <IconX className="w-5 h-5" stroke={1.8} />
              )}
              <span>{saveStatus.message}</span>
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <IconFileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" stroke={1.8} />
            <div>
              <h3 className="text-blue-800 font-medium mb-1">路径式阅读线说明</h3>
              <p className="text-blue-700 text-sm">
                阅读线必须是一条完整的连续路径，从起始章节到结束章节不能跳过中间环节。
                您需要在每个分支点选择一个方向，构成您独特的故事线路。
              </p>
            </div>
          </div>
        </div>

        {/* 编辑区域 */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6">
            {/* 基本信息 */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  阅读线名称
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入阅读线名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  描述说明（可选）
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述您这条阅读线的特点或创建理由"
                />
              </div>
            </div>
            
            {/* 路径构建界面 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 当前路径 */}
              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-4">
                  当前阅读路径 ({formData.selectedPath.length} 章节)
                </h3>
                <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                  {formData.selectedPath.length > 0 ? (
                    <div className="space-y-2 p-2">
                      {formData.selectedPath.map((chapter, index) => (
                        <div
                          key={chapter.id}
                          className="border border-slate-200 rounded-lg p-3 bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="font-medium text-slate-800">{chapter.title}</span>
                            </div>
                            {index === formData.selectedPath.length - 1 && (
                              <button
                                onClick={removeLastChapter}
                                className="p-1 text-red-400 hover:text-red-600"
                                title="移除最后一个章节"
                              >
                                <IconX className="w-4 h-4" stroke={1.8} />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={chapter.reason}
                            onChange={(e) => updateChapterReason(chapter.id, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="选择此章节的理由（可选）"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      请选择起始章节开始构建阅读路径
                    </div>
                  )}
                </div>
              </div>
              
              {/* 下一步选择 */}
              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-4">
                  {formData.selectedPath.length === 0 ? '选择起始章节' : '选择下一章节'}
                </h3>
                <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                  {(() => {
                    const nextOptions = getNextOptions();
                    return nextOptions.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {nextOptions.map(chapter => (
                          <div
                            key={chapter.id}
                            className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-blue-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{chapter.title}</p>
                              <p className="text-sm text-slate-500">
                                {chapter.word_count || 0} 字 • {chapter.author_username || ''}
                              </p>
                              {chapter.children && chapter.children.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  +{chapter.children.length} 个后续分支
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => selectChapter(chapter)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              选择
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        {formData.selectedPath.length === 0 
                          ? '暂无可用的起始章节' 
                          : '已到达路径终点，没有更多后续章节'}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
              <Link
                to={`/novel/${id}`}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </Link>
              <button
                onClick={saveReadingPath}
                disabled={saving || formData.selectedPath.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : '保存阅读线'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CustomReadingPathPage;
