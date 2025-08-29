import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconX, IconEdit, IconFileText, IconLayoutGrid, IconGitBranch } from '@tabler/icons-react';

const NovelEditSidebar = ({ novel, activeTab, onTabChange, chapters, sidebarOpen, onClose, canEditBasicSettings = true, isAuthor = true }) => {
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

  return (
    <div className={`
      fixed md:relative inset-y-0 left-0 z-50
      w-80 bg-white border-r border-slate-200 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* 侧边栏头部 */}
      <div className="p-4 md:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link
              to={`/novel/${novel.id}`}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <IconArrowLeft className="w-5 h-5" stroke={1.8} />
            </Link>
            <h2 className="text-lg font-medium text-slate-700">
              {canEditBasicSettings ? '编辑小说' : '参与创作'}
            </h2>
          </div>

          {/* 手机端关闭按钮 */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5" stroke={1.8} />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-slate-800 truncate">{novel.title}</h3>
          <p className="text-sm text-slate-600">{getNovelTypeName(novel.novel_type)}</p>
          <p className="text-sm text-slate-500">作者：{novel.author?.username}</p>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="flex-1 p-3 md:p-4">
        <nav className="space-y-2">
          {/* 基础编辑/设定 */}
          <button
            onClick={() => onTabChange('basic')}
            className={`w-full text-left px-3 md:px-4 py-3 rounded-lg transition-colors ${activeTab === 'basic'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <IconEdit className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" stroke={1.8} />
              <span className="text-sm md:text-base">
                {canEditBasicSettings ? '基础编辑' : '基础设定'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6 md:ml-7">
              {canEditBasicSettings ? '编辑小说设定和基本信息' : '查看小说设定和基本信息'}
            </p>
          </button>

          {/* 作者推荐阅读线 - 只有作者且非传统模式才显示 */}
          {isAuthor && novel.novel_type !== 'traditional' && (
            <button
              onClick={() => onTabChange('reading-paths')}
              className={`w-full text-left px-3 md:px-4 py-3 rounded-lg transition-colors ${activeTab === 'reading-paths'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <IconGitBranch className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" stroke={1.8} />
                <span className="text-sm md:text-base">推荐阅读线</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6 md:ml-7">设置作者推荐的阅读路径</p>
            </button>
          )}

          {/* 章节列表 - 所有用户都可以查看 */}
          {novel.novel_type === 'traditional' && (
            <button
              onClick={() => onTabChange('chapters')}
              className={`w-full text-left px-3 md:px-4 py-3 rounded-lg transition-colors ${activeTab === 'chapters'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <IconFileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" stroke={1.8} />
                <span className="text-sm md:text-base">章节列表</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6 md:ml-7">管理章节顺序和内容</p>
            </button>
          )}

          {/* 视图模式 - 所有类型小说都显示 */}
          <button
            onClick={() => onTabChange('view')}
            className={`w-full text-left px-3 md:px-4 py-3 rounded-lg transition-colors ${activeTab === 'view'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <IconLayoutGrid className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" stroke={1.8} />
              <span className="text-sm md:text-base">视图模式</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6 md:ml-7">
              {isAuthor ? '思维导图式章节结构' : '查看章节结构，参与创作'}
            </p>
          </button>
        </nav>
      </div>

      {/* 侧边栏底部 */}
      <div className="p-3 md:p-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>章节数</span>
            <span>{chapters.length}</span>
          </div>
          <div className="flex justify-between">
            <span>总字数</span>
            <span>{(novel.total_words || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>状态</span>
            <span className={novel.status === 'published' ? 'text-green-600' : 'text-amber-600'}>
              {novel.status === 'published' ? '已发布' : '草稿'}
            </span>
          </div>
        </div>


      </div>
    </div>
  );
};

export default NovelEditSidebar;
