import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { getNovelById, updateNovelSettings, getNovelChapters } from '../services/novelAPI';
import NovelEditSidebar from '../components/NovelEditSidebar';
import NovelEditContent from '../components/NovelEditContent';
import { IconAlertCircle, IconArrowLeft, IconMenu2 } from '@tabler/icons-react';

const NovelEditPage = () => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // basic, reading-paths, chapters, view
  const [sidebarOpen, setSidebarOpen] = useState(false); // 手机端侧边栏状态
  const [editFormData, setEditFormData] = useState({
    description: '',
    characters: '',
    worldBackground: '',
    otherSettings: '',
    isBranchingEnabled: false
  });
  
  // 封面上传相关状态
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  useEffect(() => {
    if (novelId) {
      fetchNovelDetails();
      fetchChapters();

      // 从URL参数读取tab参数
      const tab = searchParams.get('tab');
      if (tab && ['basic', 'reading-paths', 'chapters', 'view'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [novelId, searchParams]);

  // 获取小说详情
  const fetchNovelDetails = async () => {
    try {
      const result = await getNovelById(novelId);
      if (result.success) {
        setNovel(result.novel);
        // 初始化编辑表单数据
        setEditFormData({
          description: result.novel.description || '',
          characters: result.novel.characters || '',
          worldBackground: result.novel.world_background || '',
          otherSettings: result.novel.other_settings || '',
          isBranchingEnabled: result.novel.is_branching_enabled || false
        });
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

  // 处理编辑表单输入变化
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 处理封面上传
  const handleCoverChange = (file, previewUrl) => {
    console.log('NovelEditPage: handleCoverChange 被调用，文件:', file ? file.name : 'null', '预览URL:', previewUrl);
    setCoverFile(file);
    setCoverPreviewUrl(previewUrl);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      // 受限类型且已有他人参与：提交时排除不允许的字段
      const isRestrictedType = novel && (novel.novel_type === 'mountain_beyond_mountain' || novel.novel_type === 'infinite_point');
      const hasOtherContributors = !!novel?.has_other_contributors;
      const filteredPayload = { ...editFormData };
      if (isRestrictedType && hasOtherContributors) {
        delete filteredPayload.description;
        delete filteredPayload.worldBackground;
      }

      // 如果有封面上传，先上传封面
      let coverImageUrl = undefined;
      if (coverFile) {
        try {
          console.log('开始上传封面文件:', coverFile.name, coverFile.size);
          
          const formData = new FormData();
          formData.append('cover', coverFile);
          formData.append('novelId', novelId);
          
          console.log('准备发送封面上传请求到:', `/api/novels/upload-cover`);
          
          const response = await fetch(`/api/novels/upload-cover`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          console.log('封面上传响应状态:', response.status);
          
          const result = await response.json();
          console.log('封面上传响应结果:', result);
          
          if (result.success) {
            coverImageUrl = result.coverUrl;
            console.log('封面上传成功，URL:', coverImageUrl);
          } else {
            throw new Error(result.message || '封面上传失败');
          }
        } catch (error) {
          console.error('封面上传错误:', error);
          throw new Error(`封面上传失败: ${error.message}`);
        }
      } else {
        console.log('没有封面文件需要上传');
      }

              // 准备更新数据，包括封面
        const updateData = {
          ...filteredPayload,
          ...(coverImageUrl && { coverImageUrl })
        };
        
        console.log('准备更新小说数据:', updateData);
        console.log('封面URL:', coverImageUrl);
        
        const result = await updateNovelSettings(novelId, updateData);
      if (result.success) {
        // 刷新小说详情
        await fetchNovelDetails();
        
        // 清除封面上传状态
        setCoverFile(null);
        setCoverPreviewUrl(null);
        
        return { success: true, message: '保存成功！' };
      } else {
        return { success: false, message: result.message || '保存失败' };
      }
    } catch (error) {
      return { success: false, message: '网络错误，请稍后重试' };
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
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            <p className="text-red-600 font-medium">小说不存在或已被删除</p>
          </div>
          <div className="text-center py-12">
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

  // 检查访问权限
  const isAuthor = novel.author?.id === user?.id;
  const canEditBasicSettings = isAuthor; // 只有作者可以编辑基础设定
  const canParticipate = !isAuthor &&
    novel.novel_type !== 'traditional' &&
    novel.novel_type !== 'author_original'; // 非作者且非传统/作者独创类型可以参与创作

  // 如果既不是作者也不能参与创作，则拒绝访问
  if (!isAuthor && !canParticipate) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
            <p className="text-red-600 font-medium">无权限访问</p>
          </div>
          <div className="text-center py-12">
            <button
              onClick={() => navigate(`/novel/${novelId}`)}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

      <div className="flex h-[calc(100vh-4rem-1px)]">
        {/* 手机端侧边栏遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 左侧侧边栏 */}
        <NovelEditSidebar
          novel={novel}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // 更新URL参数，保持tab状态
            setSearchParams({ tab });
            // 手机端选择标签后自动关闭侧边栏
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          chapters={chapters}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          canEditBasicSettings={canEditBasicSettings}
          isAuthor={isAuthor}
        />

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto">
          {/* 手机端顶部工具栏 */}
          <div className="md:hidden bg-white border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <IconMenu2 className="w-6 h-6" stroke={1.8} />
              </button>
              <h1 className="text-lg font-medium text-slate-700 truncate flex-1 mx-4">
                {activeTab === 'basic' && (canEditBasicSettings ? '基础编辑' : '基础设定')}
                {activeTab === 'reading-paths' && '推荐阅读线'}
                {activeTab === 'chapters' && '章节列表'}
                {activeTab === 'view' && '视图模式'}
              </h1>
              {/* 手机端保存按钮 - 仅在基础编辑且有权限时显示 */}
              {activeTab === 'basic' && canEditBasicSettings ? (
                <button
                  onClick={async () => {
                    const result = await handleSaveEdit();
                    if (result.success) {
                      alert('保存成功！');
                    } else {
                      alert(`保存失败：${result.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              ) : (
                <div className="w-16"></div>
              )}
            </div>
          </div>

          <NovelEditContent
            activeTab={activeTab}
            novel={novel}
            chapters={chapters}
            editFormData={editFormData}
            onEditInputChange={handleEditInputChange}
            onSaveEdit={handleSaveEdit}
            onRefreshChapters={fetchChapters}
            canEditBasicSettings={canEditBasicSettings}
            isAuthor={isAuthor}
            disableDescription={isAuthor && (novel.novel_type === 'mountain_beyond_mountain' || novel.novel_type === 'infinite_point') && !!novel.has_other_contributors}
            disableWorldBackground={isAuthor && (novel.novel_type === 'mountain_beyond_mountain' || novel.novel_type === 'infinite_point') && !!novel.has_other_contributors}
            onCoverChange={handleCoverChange}
            coverPreviewUrl={coverPreviewUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default NovelEditPage;
