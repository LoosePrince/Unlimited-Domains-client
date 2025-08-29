import React, { useState, useRef } from 'react';
import { uploadAPI } from '../services/uploadAPI';
import { useAuth } from '../contexts/AuthContext';

const AvatarUpload = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 JPG, PNG, GIF, WebP 格式的图片');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await uploadAPI.uploadAvatar(selectedFile);
      
      if (response.success) {
        // 更新用户信息
        updateUser(response.data.user);
        onSuccess && onSuccess(response.data.avatar_url);
        onClose();
      } else {
        setError(response.message || '上传失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      setError(error.response?.data?.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理删除头像
  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    setError('');

    try {
      const response = await uploadAPI.deleteAvatar();
      
      if (response.success) {
        // 更新用户信息
        updateUser(response.data.user);
        onSuccess && onSuccess('none');
        onClose();
      } else {
        setError(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      setError(error.response?.data?.message || '删除失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 重置选择
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">更换头像</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* 当前头像 */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600 mb-2">当前头像</p>
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-200">
            {user?.avatar_url && user.avatar_url !== 'none' ? (
              <img
                src={user.avatar_url}
                alt="当前头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 文件选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择新头像
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* 预览 */}
        {previewUrl && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">预览</p>
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-blue-300">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {selectedFile ? (
            <>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '上传中...' : '上传头像'}
              </button>
              <button
                onClick={handleReset}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重置
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              选择文件
            </button>
          )}
          
          {user?.avatar_url && user.avatar_url !== 'none' && (
            <button
              onClick={handleDeleteAvatar}
              disabled={isUploading}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              删除头像
            </button>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-4 text-xs text-gray-500">
          <p>支持 JPG, PNG, GIF, WebP 格式</p>
          <p>文件大小不能超过 10MB</p>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;
