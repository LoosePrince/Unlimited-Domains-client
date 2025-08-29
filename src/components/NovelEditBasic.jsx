import React, { useState } from 'react';
import NovelCoverUpload from './NovelCoverUpload';

const NovelEditBasic = ({ 
  novel, 
  editFormData, 
  onEditInputChange, 
  readOnly = false, 
  disableDescription = false, 
  disableWorldBackground = false,
  onCoverChange,
  coverPreviewUrl
}) => {
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* 基本信息 */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">基本信息</h3>

          {/* 封面上传和小说标题在同一行 */}
          <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
            {/* 封面上传 */}
            <div className="flex-shrink-0">
              <NovelCoverUpload
                currentCoverUrl={coverPreviewUrl || (novel.cover_image_url && novel.cover_image_url !== 'none' ? novel.cover_image_url : null)}
                onCoverChange={onCoverChange}
                disabled={readOnly}
                hasExistingCover={novel.cover_image_url && novel.cover_image_url !== 'none'}
                hasOtherContributors={(novel.novel_type === 'mountain_beyond_mountain' || novel.novel_type === 'infinite_point') && !!novel.has_other_contributors}
              />
            </div>

            {/* 小说标题和类型 */}
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">小说标题</label>
                <input
                  type="text"
                  value={novel.title}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1">小说标题不可修改</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">小说类型</label>
                <input
                  type="text"
                  value={getNovelTypeName(novel.novel_type)}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1">小说类型不可修改</p>
              </div>
            </div>
          </div>
        </div>

        {/* 小说设定 */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">小说设定</h3>
          {(novel.novel_type === 'mountain_beyond_mountain' || novel.novel_type === 'infinite_point') && novel.has_other_contributors && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              该小说已有其它用户参与创作：当前类型不允许修改"小说封面"、"“小说简介”和“世界背景”。
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">小说简介</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={onEditInputChange}
                disabled={readOnly || disableDescription}
                rows={4}
                className={`w-full px-4 py-3 border border-slate-200 rounded-lg ${(readOnly || disableDescription)
                    ? 'bg-slate-50 text-slate-600 cursor-not-allowed'
                    : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                placeholder={readOnly ? '' : "请输入小说简介"}
              />
              <p className="text-xs text-slate-500 mt-1">
                {disableDescription ? '该小说已有其它用户参与创作，当前类型不允许修改小说简介' : '简要介绍小说的主要情节和特色'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">人物设定</label>
                <textarea
                  name="characters"
                  value={editFormData.characters}
                  onChange={onEditInputChange}
                  disabled={readOnly}
                  rows={6}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-lg ${readOnly
                      ? 'bg-slate-50 text-slate-600 cursor-not-allowed'
                      : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                  placeholder={readOnly ? '' : "描述主要人物设定"}
                />
                <p className="text-xs text-slate-500 mt-1">描述主要角色的性格、背景和能力</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">世界背景</label>
                <textarea
                  name="worldBackground"
                  value={editFormData.worldBackground}
                  onChange={onEditInputChange}
                  disabled={readOnly || disableWorldBackground}
                  rows={6}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-lg ${(readOnly || disableWorldBackground)
                      ? 'bg-slate-50 text-slate-600 cursor-not-allowed'
                      : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                  placeholder={readOnly ? '' : "描述世界观背景"}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {disableWorldBackground ? '该小说已有其它用户参与创作，当前类型不允许修改世界背景' : '描述故事发生的世界环境和背景设定'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">其他设定</label>
              <textarea
                name="otherSettings"
                value={editFormData.otherSettings}
                onChange={onEditInputChange}
                disabled={readOnly}
                rows={4}
                className={`w-full px-4 py-3 border border-slate-200 rounded-lg ${readOnly
                    ? 'bg-slate-50 text-slate-600 cursor-not-allowed'
                    : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                placeholder={readOnly ? '' : "其他重要设定"}
              />
              <p className="text-xs text-slate-500 mt-1">描述其他重要的世界观设定和规则</p>
            </div>
          </div>
        </div>

        {/* 分支创作设置 */}
        {novel.novel_type === 'traditional' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-slate-700 mb-4">分支创作设置</h3>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="flex items-center group relative">
                <input
                  type="checkbox"
                  name="isBranchingEnabled"
                  checked={editFormData.isBranchingEnabled}
                  onChange={onEditInputChange}
                  disabled={readOnly}
                  className={`w-4 h-4 text-amber-600 border-amber-300 rounded ${readOnly ? 'cursor-not-allowed opacity-50' : 'focus:ring-amber-500'
                    }`}
                />
                <span className="ml-2 text-sm font-medium text-amber-800">启用分支创作</span>
              </label>
              {readOnly ? (
                <p className="text-xs text-amber-700 mt-2">
                  ⚠️ 只有小说作者才能修改分支创作设置
                </p>
              ) : (
                <>
                  <p className="text-xs text-amber-700 mt-2">
                    ⚠️ 启用分支创作后，小说类型将自动变为"作者独创"，且无法再关闭此功能
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    启用后，你将可以创建分支章节，但其他用户无法为你的小说创建分支
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* 标签 */}
        <div className="p-6 border-t border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">标签</h3>

          <div className="flex flex-wrap gap-2">
            {novel.tags && novel.tags.length > 0 ? (
              novel.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-slate-500 text-sm">暂无标签</p>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {readOnly ? '标签功能暂未开放编辑' : '标签功能暂未开放编辑'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NovelEditBasic;
