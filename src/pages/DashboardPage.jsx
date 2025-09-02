import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../components/Modal';
import { getMyNovels, getParticipatedNovels, createNovel, deleteNovel, getNovelById } from '../services/novelAPI';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import NovelCover from '../components/NovelCover';
import NovelCoverAdvanced from '../components/NovelCoverAdvanced';
import { 
  IconFileText, 
  IconCheck, 
  IconTrendingUp, 
  IconPlus, 
  IconX, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const modal = useModal();
  const navigate = useNavigate();

  const [novels, setNovels] = useState([]);
  const [participatedNovels, setParticipatedNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participatedLoading, setParticipatedLoading] = useState(false);
  const [activeList, setActiveList] = useState('mine'); // 'mine' | 'participated'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 创建小说表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    novelType: 'traditional',
    isBranchingEnabled: false,
    requiresApproval: false,
    autoApproveDays: 7,
    allowWebsiteUsage: true,
    tags: [],
    characters: '',
    worldBackground: '',
    otherSettings: '',
    coverTheme: 'default'
  });

  const [tagInput, setTagInput] = useState('');



  // 检查用户是否已登录
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeList === 'mine') {
      fetchMyNovels();
    } else {
      fetchParticipated();
    }
  }, [isAuthenticated, navigate, activeList]);

  // 获取用户的小说列表
  const fetchMyNovels = async () => {
    try {
      setLoading(true);
      const result = await getMyNovels();
      if (result.success) {
        setNovels(result.novels || []);
      } else {
        setError(result.message || '获取小说列表失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取我参与创作的小说列表（排除自己的小说）
  const fetchParticipated = async () => {
    try {
      setParticipatedLoading(true);
      const result = await getParticipatedNovels();
      if (result.success) {
        setParticipatedNovels(result.novels || []);
      } else {
        setError(result.message || '获取参与创作的小说失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setParticipatedLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'novelType') {
      // 当选择小说类型时
      const newNovelType = value;
      setFormData(prev => ({
        ...prev,
        novelType: newNovelType,
        // 如果选择"作者独创"，自动启用分支创作
        isBranchingEnabled: newNovelType === 'author_original'
      }));
    } else if (name === 'isBranchingEnabled') {
      // 当切换分支创作开关时
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // 启用时切换到"作者独创"，关闭时回到"传统"
        novelType: checked ? 'author_original' : 'traditional'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // 移除标签
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 创建小说
  const handleCreateNovel = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('请输入小说标题');
      return;
    }

    try {
      setCreateLoading(true);
      setError('');

      const result = await createNovel(formData);

      if (result.success) {
        setSuccess('小说创建成功！');
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          novelType: 'traditional',
          isBranchingEnabled: false,
          requiresApproval: false,
          autoApproveDays: 7,
          allowWebsiteUsage: true,
          tags: [],
          characters: '',
          worldBackground: '',
          otherSettings: ''
        });
        fetchMyNovels(); // 刷新列表
      } else {
        setError(result.message || '创建失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  // 删除小说
  const handleDeleteNovel = async (novelId) => {
    // 拉最新详情，避免本地 has_other_contributors 过期
    let target = novels.find(n => n.id === novelId);
    try {
      const latest = await getNovelById(novelId);
      if (latest && latest.success && latest.novel) {
        target = latest.novel;
      }
    } catch { }

    const isRestricted = target && (target.novel_type === 'mountain_beyond_mountain' || target.novel_type === 'infinite_point') && target.has_other_contributors;

    if (isRestricted) {
      modal.showWarning({
        title: '无法删除',
        message: '该小说已有其它用户参与创作，当前类型不允许删除小说。'
      });
      return;
    }

    modal.showConfirm({
      type: 'warning',
      title: '确认删除',
      message: '确定要删除这本小说吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: () => confirmDelete(novelId)
    });
  };

  const confirmDelete = async (novelId) => {
    try {
      const result = await deleteNovel(novelId);
      if (result.success) {
        modal.showSuccessToast('小说删除成功！');
        fetchMyNovels();
      } else {
        modal.showError({
          title: '删除失败',
          message: result.message || '删除失败，请稍后重试'
        });
      }
    } catch (error) {
      modal.showError({
        title: '网络错误',
        message: '网络连接失败，请检查网络后重试'
      });
    }
  };

  // 跳转到编辑页面
  const handleEditNovel = (novel) => {
    navigate(`/novel/${novel.id}/edit`);
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-slate-700 mb-4">创作中心</h1>
          <p className="text-slate-600">欢迎回来，{user?.username || '创作者'}</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IconFileText className="w-6 h-6 text-blue-600" stroke={1.8} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">我的小说</p>
                <p className="text-2xl font-semibold text-slate-900">{novels.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <IconCheck className="w-6 h-6 text-green-600" stroke={1.8} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">已发布</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {novels.filter(n => n.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <IconTrendingUp className="w-6 h-6 text-purple-600" stroke={1.8} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">总字数</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {novels.reduce((total, novel) => total + (novel.total_words || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 列表切换与操作 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveList('mine')}
              className={`px-4 py-2 rounded-lg border transition-colors ${activeList === 'mine' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              我的小说
            </button>
            <button
              onClick={() => setActiveList('participated')}
              className={`px-4 py-2 rounded-lg border transition-colors ${activeList === 'participated' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              我参与的小说
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center"
          >
            <IconPlus className="w-5 h-5 mr-2" stroke={1.8} />
            创建小说
          </button>
        </div>

        {/* 消息提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* 创建小说表单 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-medium text-slate-700">创建新小说</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-6 h-6" stroke={1.8} />
                </button>
              </div>

              <form onSubmit={handleCreateNovel} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">小说标题 *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="请输入小说标题"
                    />
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      为你的小说起一个吸引人的标题
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>

                  <div className="group relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">小说类型</label>
                    <select
                      name="novelType"
                      value={formData.novelType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="traditional">传统</option>
                      <option value="author_original">作者独创</option>
                      <option value="mountain_beyond_mountain">山外有山</option>
                      <option value="infinite_point">无限点</option>
                    </select>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      选择小说类型，影响分支创作权限
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">小说简介</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="请输入小说简介"
                  />
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    简要介绍小说的主要情节和特色
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">标签</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="输入标签后按回车添加"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                    >
                      添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-slate-400 hover:text-slate-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    添加标签帮助读者更好地发现你的小说
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">人物设定</label>
                    <textarea
                      name="characters"
                      value={formData.characters}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="描述主要人物设定"
                    />
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      描述主要角色的性格、背景和能力
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>

                  <div className="group relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">世界背景</label>
                    <textarea
                      name="worldBackground"
                      value={formData.worldBackground}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="描述世界观背景"
                    />
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      描述故事发生的世界环境和背景设定
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">其他设定</label>
                  <textarea
                    name="otherSettings"
                    value={formData.otherSettings}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="其他重要设定"
                  />
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    描述其他重要的世界观设定和规则
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* 只有在传统模式下才显示"启用分支创作"选项 */}
                  {formData.novelType === 'traditional' && (
                    <label className="flex items-center group relative">
                      <input
                        type="checkbox"
                        name="isBranchingEnabled"
                        checked={formData.isBranchingEnabled}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                      />
                      <span className="ml-2 text-sm text-slate-600">启用分支创作</span>
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        启用后小说类型将自动变为"作者独创"，允许作者创建分支
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center group relative">
                    <input
                      type="checkbox"
                      name="allowWebsiteUsage"
                      checked={formData.allowWebsiteUsage}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                    />
                    <span className="ml-2 text-sm text-slate-600">允许网站使用</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      允许网站使用小说内容进行商业行为
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                  >
                    {createLoading ? '创建中...' : '创建小说'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* 小说列表 */}
        {activeList === 'mine' ? (loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            <p className="mt-2 text-slate-600">加载中...</p>
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">还没有小说</h3>
            <p className="text-slate-500 mb-4">开始创作你的第一部小说吧！</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              创建小说
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <div key={novel.id} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex gap-4 mb-4">
                  {/* 封面 */}
                  <NovelCoverAdvanced
                    title={novel.title}
                    author={novel.author_username || '未知'}
                    theme="default"
                    coverUrl={novel.cover_image_url}
                    size="sm"
                    className="w-24 h-32 md:w-32 md:h-40"
                  />
                  
                  {/* 小说信息 */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-slate-700 mb-2 line-clamp-2">{novel.title}</h3>
                        <p className="text-sm text-slate-500 mb-2">{getNovelTypeName(novel.novel_type)}</p>
                        <p className="text-xs text-slate-400">创建于 {formatDate(novel.created_at)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditNovel(novel)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="编辑小说"
                        >
                          <IconEdit className="w-4 h-4" stroke={1.8} />
                        </button>
                        <button
                          onClick={() => handleDeleteNovel(novel.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          <IconTrash className="w-4 h-4" stroke={1.8} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {novel.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{novel.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>章节: {novel.total_chapters || 0}</span>
                  <span>字数: {(novel.total_words || 0).toLocaleString()}</span>
                </div>

                {novel.tags && novel.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {novel.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {novel.tags.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                        +{novel.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/novel/${novel.id}`)}
                    className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )) : (participatedLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            <p className="mt-2 text-slate-600">加载中...</p>
          </div>
        ) : participatedNovels.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">还没有参与他人的小说创作</h3>
            <p className="text-slate-500 mb-4">去发现页寻找有趣的小说，参与创作吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {participatedNovels.map((novel) => (
              <div key={novel.id} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex gap-4 mb-4">
                  {/* 封面 */}
                  <NovelCoverAdvanced
                    title={novel.title}
                    author={novel.author?.username || '未知'}
                    theme="default"
                    coverUrl={novel.cover_image_url}
                    size="sm"
                    className="w-24 h-32 md:w-32 md:h-40"
                  />
                  
                  {/* 小说信息 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-700 mb-2 line-clamp-2">{novel.title}</h3>
                    <p className="text-sm text-slate-500 mb-1">{getNovelTypeName(novel.novel_type)}</p>
                    <p className="text-xs text-slate-500">作者：{novel.author?.username || '未知'}</p>
                  </div>
                </div>

                {novel.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{novel.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>章节: {novel.total_chapters || 0}</span>
                  <span>字数: {(novel.total_words || 0).toLocaleString()}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/novel/${novel.id}`)}
                    className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
