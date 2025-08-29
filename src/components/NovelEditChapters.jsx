import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconAlertCircle, IconFileText, IconEye, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

const NovelEditChapters = ({ novel, chapters, onRefreshChapters, isAuthor = true, canParticipate = false }) => {
  const [editingChapter, setEditingChapter] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: ''
  });

  // 开始编辑章节
  const handleStartEdit = (chapter) => {
    setEditingChapter(chapter.id);
    setEditForm({
      title: chapter.title,
      content: chapter.content
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingChapter(null);
    setEditForm({ title: '', content: '' });
  };

  // 保存编辑
  const handleSaveEdit = async (chapterId) => {
    try {
      // 这里应该调用API保存章节编辑
      // 暂时只是模拟
      console.log('保存章节编辑:', chapterId, editForm);

      // 刷新章节列表
      onRefreshChapters();
      setEditingChapter(null);
      setEditForm({ title: '', content: '' });
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
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

  // 检查是否有权限查看章节列表
  if (!isAuthor && !canParticipate) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <IconAlertCircle className="w-12 h-12 text-red-400" stroke={1.8} />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">无权限访问</h3>
        <p className="text-slate-500 mb-4">您没有权限查看此小说的章节列表</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* 章节列表头部 */}
        <div className="p-4 md:p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-slate-700">章节列表</h3>
              <p className="text-slate-500 text-sm">管理章节的顺序、内容和状态</p>
            </div>

            {(isAuthor || canParticipate) && (
              <Link
                to={`/novel/${novel.id}/create-chapter`}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center block"
              >
                {isAuthor ? '创建新章节' : '参与创作'}
              </Link>
            )}
          </div>
        </div>

        {/* 章节列表 */}
        <div className="p-4 md:p-6">
          {chapters.length === 0 ? (
            <div className="text-center py-8">
              <IconFileText className="w-8 h-8 md:w-12 md:h-12 text-slate-400" stroke={1.8} />
              <p className="text-slate-500">暂无章节</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-4">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-6">
                  {editingChapter === chapter.id ? (
                    // 编辑模式
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">章节标题</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">章节内容</label>
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                          className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={handleCancelEdit}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSaveEdit(chapter.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="space-y-3 md:space-y-4">
                      {/* 章节头部信息 - 手机端更紧凑布局 */}
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-2 md:space-y-0">
                        <div className="flex-1 min-w-0">
                          {/* 章节序号、类型和操作按钮 - 手机端横向排列 */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs md:text-sm font-medium text-slate-500 whitespace-nowrap">第{index + 1}章</span>
                              <span className={`px-2 py-0.5 md:py-1 text-xs rounded-full whitespace-nowrap ${chapter.chapter_type === 'ending' ? 'bg-red-100 text-red-700' :
                                  chapter.chapter_type === 'tail_connection' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {getChapterTypeName(chapter.chapter_type)}
                              </span>
                            </div>

                            {/* 操作按钮 - 手机端显示在右侧，桌面端隐藏 */}
                            <div className="flex md:hidden space-x-1">
                              {isAuthor && (
                                <button
                                  onClick={() => handleStartEdit(chapter)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="编辑章节"
                                >
                                  <IconEdit className="w-4 h-4" stroke={1.8} />
                                </button>
                              )}

                              <Link
                                to={`/novel/${novel.id}/chapter/${chapter.id}`}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="查看章节"
                              >
                                <IconEye className="w-4 h-4" stroke={1.8} />
                              </Link>
                            </div>
                          </div>

                          {/* 章节标题 - 手机端更小字体 */}
                          <h4 className="text-sm md:text-lg font-medium text-slate-700 mb-1 md:mb-2 break-words leading-tight">{chapter.title}</h4>

                          {/* 章节内容预览 - 手机端更少行数 */}
                          <p className="text-xs md:text-sm text-slate-600 line-clamp-1 md:line-clamp-3 break-words leading-relaxed overflow-hidden">{chapter.content}</p>
                        </div>

                        {/* 操作按钮 - 桌面端显示在右侧 */}
                        <div className="hidden md:flex space-x-2 ml-4">
                          {isAuthor && (
                            <button
                              onClick={() => handleStartEdit(chapter)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="编辑章节"
                            >
                              <IconEdit className="w-4 h-4" stroke={1.8} />
                            </button>
                          )}

                          <Link
                            to={`/novel/${novel.id}/chapter/${chapter.id}`}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="查看章节"
                          >
                            <IconEye className="w-4 h-4" stroke={1.8} />
                          </Link>
                        </div>
                      </div>

                      {/* 章节底部信息 - 手机端更紧凑 */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-slate-500">
                          <span className="whitespace-nowrap flex-shrink-0">作者：{chapter.author_username || '未知'}</span>
                          <span className="whitespace-nowrap flex-shrink-0">字数：{chapter.word_count?.toLocaleString() || 0}</span>
                          <span className="whitespace-nowrap flex-shrink-0">创建于：{formatDate(chapter.created_at)}</span>
                          <span className={`px-2 py-0.5 md:py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 ${chapter.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {chapter.is_published ? '已发布' : '草稿'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovelEditChapters;
