import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NovelEditBasic from './NovelEditBasic';
import NovelEditReadingPaths from './NovelEditReadingPaths';
import NovelEditChapters from './NovelEditChapters';
import NovelEditView from './NovelEditView';
import { IconEye, IconEyeOff, IconCheck, IconX } from '@tabler/icons-react';

const NovelEditContent = ({
  activeTab,
  novel,
  chapters,
  editFormData,
  onEditInputChange,
  onSaveEdit,
  onRefreshChapters,
  canEditBasicSettings = true,
  isAuthor = true,
  disableDescription = false,
  disableWorldBackground = false,
  onCoverChange,
  coverPreviewUrl
}) => {
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });
  const [showPreview, setShowPreview] = useState(false);

  // 处理保存
  const handleSave = async () => {
    const result = await onSaveEdit();
    setSaveStatus({
      show: true,
      success: result.success,
      message: result.message
    });

    // 3秒后隐藏状态
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // 渲染内容区域
  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <NovelEditBasic
            novel={novel}
            editFormData={editFormData}
            onEditInputChange={onEditInputChange}
            onSave={handleSave}
            readOnly={!canEditBasicSettings}
            disableDescription={disableDescription}
            disableWorldBackground={disableWorldBackground}
            onCoverChange={onCoverChange}
            coverPreviewUrl={coverPreviewUrl}
          />
        );

      case 'reading-paths':
        return (
          <NovelEditReadingPaths
            novel={novel}
            chapters={chapters}
          />
        );

      case 'chapters':
        return (
          <NovelEditChapters
            novel={novel}
            chapters={chapters}
            onRefreshChapters={onRefreshChapters}
            isAuthor={isAuthor}
            canParticipate={!isAuthor && novel.novel_type !== 'traditional' && novel.novel_type !== 'author_original'}
          />
        );

      case 'view':
        return (
          <NovelEditView
            novel={novel}
            chapters={chapters}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-500">请选择一个编辑选项</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-slate-50">
      {/* 顶部操作栏 - 仅桌面端显示 */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === 'basic' && (canEditBasicSettings ? '基础编辑' : '基础设定')}
              {activeTab === 'reading-paths' && '推荐阅读线'}
              {activeTab === 'chapters' && '章节列表'}
              {activeTab === 'view' && '视图模式'}
            </h1>
            <p className="text-slate-600 mt-1">
              {activeTab === 'basic' && (canEditBasicSettings ? '编辑小说的基本信息、设定和配置' : '查看小说的基本信息、设定和配置')}
              {activeTab === 'reading-paths' && '设置作者推荐的阅读路径'}
              {activeTab === 'chapters' && '管理章节的顺序、内容和状态'}
              {activeTab === 'view' && '以思维导图形式查看章节结构'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {activeTab === 'basic' && canEditBasicSettings && (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存更改
              </button>
            )}

            <Link
              to={`/novel/${novel.id}`}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              返回小说
            </Link>
          </div>
        </div>
      </div>

      {/* 保存状态提示 */}
      {saveStatus.show && (
        <div className={`mx-6 mt-4 p-4 rounded-lg border ${saveStatus.success
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

      {/* 内容区域 */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default NovelEditContent;
