import React, { useState } from 'react';
import { useModal } from './index';

const DarkModeExample = () => {
  const modal = useModal();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 普通弹窗示例
  const showAlertExample = () => {
    modal.showSuccess({
      title: '操作成功',
      message: '这是一个夜间模式的成功提示弹窗！',
      darkMode: isDarkMode,
      confirmText: '知道了'
    });
  };

  // 确认弹窗示例
  const showConfirmExample = () => {
    modal.showConfirm({
      type: 'warning',
      title: '确认删除',
      message: '确定要删除这个项目吗？此操作不可恢复。',
      darkMode: isDarkMode,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: () => {
        modal.showSuccessToast('删除成功', { darkMode: isDarkMode });
      }
    });
  };

  // 表单弹窗示例
  const showFormExample = () => {
    const [formData, setFormData] = useState({ name: '', email: '' });

    modal.showForm({
      title: '编辑用户信息',
      darkMode: isDarkMode,
      confirmText: '保存',
      cancelText: '取消',
      children: (
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-slate-200' : 'text-gray-700'
            }`}>
              姓名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-slate-200' : 'text-gray-700'
            }`}>
              邮箱
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-slate-100 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
              placeholder="请输入邮箱"
            />
          </div>
        </div>
      ),
      onConfirm: () => {
        modal.showSuccessToast('信息保存成功', { darkMode: isDarkMode });
      }
    });
  };

  // Toast示例
  const showToastExample = () => {
    modal.showToast({
      type: 'info',
      message: '这是夜间模式的提示消息',
      darkMode: isDarkMode,
      duration: 4000
    });
  };

  return (
    <div className={`p-8 min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md mx-auto">
        <h1 className={`text-2xl font-bold mb-6 text-center ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          弹窗夜间模式示例
        </h1>

        {/* 模式切换 */}
        <div className="mb-8">
          <label className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              className="mr-2"
            />
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              启用夜间模式
            </span>
          </label>
        </div>

        {/* 示例按钮 */}
        <div className="space-y-4">
          <button
            onClick={showAlertExample}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            显示成功弹窗
          </button>

          <button
            onClick={showConfirmExample}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            显示确认弹窗
          </button>

          <button
            onClick={showFormExample}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            显示表单弹窗
          </button>

          <button
            onClick={showToastExample}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            显示Toast消息
          </button>
        </div>

        <div className={`mt-8 p-4 rounded-lg ${
          isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-700'
        }`}>
          <h3 className="font-medium mb-2">使用说明：</h3>
          <ul className="text-sm space-y-1">
            <li>• 切换夜间模式开关来体验不同主题</li>
            <li>• 所有弹窗都会根据当前模式自动调整样式</li>
            <li>• 夜间模式下背景变深，文字颜色自动调整</li>
            <li>• 图标和按钮颜色也会相应适配</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DarkModeExample;