import React, { useState, useEffect } from 'react';
import { IconPlus, IconMinus, IconCheck, IconX, IconFileText, IconTrash } from '@tabler/icons-react';
import * as novelAPI from '../services/novelAPI';

const NovelEditReadingPaths = ({ novel, chapters }) => {
  const [authorPath, setAuthorPath] = useState(null);
  const [chapterTree, setChapterTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '作者推荐阅读线',
    description: '',
    selectedPath: [] // 改为路径选择模式
  });
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

  useEffect(() => {
    fetchData();
  }, [novel.id]);

  // 获取数据（章节树和作者推荐阅读线）
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 并行获取章节树和作者推荐阅读线
      const [chapterTreeResult, authorPathResult] = await Promise.all([
        novelAPI.getChapterTree(novel.id),
        novelAPI.getAuthorRecommendedPath(novel.id)
      ]);

      // 设置章节树
      if (chapterTreeResult.success) {
        setChapterTree(chapterTreeResult.chapterTree || []);
      }

      // 设置作者推荐阅读线
      if (authorPathResult.success && authorPathResult.authorPath) {
        setAuthorPath(authorPathResult.authorPath);
        setFormData({
          name: authorPathResult.authorPath.name || '作者推荐阅读线',
          description: authorPathResult.authorPath.description || '',
          selectedPath: []
        });
        
        // 获取阅读线详情（包含章节列表）
        const pathDetail = await novelAPI.getReadingPathDetail(novel.id, authorPathResult.authorPath.id);
        if (pathDetail.success && pathDetail.readingPath.chapters) {
          setFormData(prev => ({
            ...prev,
            selectedPath: pathDetail.readingPath.chapters.map(ch => ({
              id: ch.chapter_id,
              title: ch.chapter_title,
              reason: ch.branch_choice_reason || ''
            }))
          }));
        }
      } else {
        setAuthorPath(null);
      }
    } catch (error) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const startEditing = () => {
    setEditing(true);
    if (!authorPath) {
      // 如果没有阅读线，初始化一个空的
      setFormData({
        name: '作者推荐阅读线',
        description: '',
        selectedPath: []
      });
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditing(false);
    // 重新获取数据以恢复原始状态
    fetchData();
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
          alert('只能选择当前章节的直接后续章节');
          return prev;
        }
      }
    });
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
      if (formData.selectedPath.length === 0) {
        setSaveStatus({
          show: true,
          success: false,
          message: '请至少选择一个章节'
        });
        return;
      }

      const pathData = {
        name: formData.name,
        description: formData.description,
        pathType: 'author_recommended',
        chapters: formData.selectedPath.map(c => ({
          chapterId: c.id,
          reason: c.reason
        }))
      };

      let result;
      if (authorPath) {
        // 更新现有阅读线
        result = await novelAPI.updateReadingPath(novel.id, authorPath.id, pathData);
      } else {
        // 创建新阅读线
        result = await novelAPI.createReadingPath(novel.id, pathData);
      }

      if (result.success) {
        setSaveStatus({
          show: true,
          success: true,
          message: '阅读线保存成功！'
        });
        setEditing(false);
        fetchData(); // 重新获取数据
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
    }

    // 3秒后隐藏状态
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
        <p className="mt-2 text-slate-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
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
            <h3 className="text-blue-800 font-medium mb-1">作者推荐阅读线</h3>
            <p className="text-blue-700 text-sm">
              为您的小说设置推荐的阅读路径。阅读线必须是一条完整的连续路径，
              从起始章节到结束章节不能跳过中间环节。您需要在每个分支点选择一个方向，
              构成您推荐的故事线路。
            </p>
          </div>
        </div>
      </div>

      {!editing ? (
        // 查看模式
        <div className="space-y-6">
          {authorPath ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-800">{authorPath.name}</h3>
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  编辑阅读线
                </button>
              </div>
              
              {authorPath.description && (
                <p className="text-slate-600 mb-4">{authorPath.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-4">
                <div>章节数：{authorPath.total_chapters || 0}</div>
                <div>总字数：{(authorPath.total_words || 0).toLocaleString()}</div>
              </div>
              
              {authorPath.total_chapters > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">阅读路径</h4>
                  <div className="space-y-2">
                    {formData.selectedPath.map((chapter, index) => (
                      <div key={chapter.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                        <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{chapter.title}</p>
                          {chapter.reason && (
                            <p className="text-sm text-slate-600 mt-1">理由：{chapter.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <IconFileText className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
              <h3 className="text-lg font-medium text-slate-700 mb-2">还没有推荐阅读线</h3>
              <p className="text-slate-500 mb-4">为您的小说创建推荐阅读路径，帮助读者更好地体验您的故事</p>
              <button
                onClick={startEditing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建推荐阅读线
              </button>
            </div>
          )}
        </div>
      ) : (
        // 编辑模式
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              {authorPath ? '编辑推荐阅读线' : '创建推荐阅读线'}
            </h3>
            
            {/* 基本信息 */}
            <div className="space-y-4 mb-6">
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
                  描述说明
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述这条阅读线的特点或推荐理由"
                />
              </div>
            </div>
            
            {/* 路径构建界面 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 当前路径 */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3">
                  推荐阅读路径 ({formData.selectedPath.length} 章节)
                </h4>
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
                                <IconMinus className="w-4 h-4" stroke={1.8} />
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
                      请选择起始章节开始构建推荐路径
                    </div>
                  )}
                </div>
              </div>
              
              {/* 下一步选择 */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3">
                  {formData.selectedPath.length === 0 ? '选择起始章节' : '选择下一章节'}
                </h4>
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
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={cancelEditing}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveReadingPath}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存阅读线
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelEditReadingPaths;
