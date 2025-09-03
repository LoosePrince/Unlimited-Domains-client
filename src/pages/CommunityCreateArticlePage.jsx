import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/authAPI';
import { createArticle } from '../services/communityAPI';
import { IconPhoto, IconX, IconAlertCircle } from '@tabler/icons-react';

const CommunityCreateArticlePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverError, setCoverError] = useState('');
  
  const fileInputRef = useRef(null);

  // 处理封面文件选择
  const handleCoverSelect = (file) => {
    setCoverError('');
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setCoverError('请选择图片文件');
      return;
    }
    
    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('图片大小不能超过5MB');
      return;
    }
    
    setCoverFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 处理拖拽
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCoverSelect(files[0]);
    }
  };

  // 移除封面
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverError('');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('请先登录');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和正文');
      return;
    }
    setError('');
    setSaving(true);
    
    try {
      // 先创建文章
      const res = await createArticle({ title: title.trim(), content: content.trim() });
      
      if (res.success) {
        // 如果有封面文件，上传封面
        if (coverFile) {
          try {
            const formData = new FormData();
            formData.append('cover', coverFile);

            const coverResponse = await api.post(`/community/articles/${res.articleId}/cover`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            if (!coverResponse.success) {
              console.warn('封面上传失败，但不影响文章发布');
            }
          } catch (coverError) {
            console.warn('封面上传出错，但不影响文章发布:', coverError);
          }
        }
        
        // 跳转到文章详情页
        navigate(`/community/articles/${res.articleId}`);
      } else {
        setError(res.message || '发布失败');
      }
    } catch (error) {
      setError('发布失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">发布文章</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
        
        {/* 封面选择区域 */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">文章封面（可选）</label>
          
          {coverPreview ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={coverPreview} 
                  alt="封面预览" 
                  className="w-32 h-24 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <IconX className="w-4 h-4" stroke={2} />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-2">已选择封面图片</p>
                <p className="text-xs text-slate-500">支持 JPG、PNG 格式，最大 5MB</p>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconPhoto className="w-12 h-12 text-slate-400 mx-auto mb-3" stroke={1.5} />
              <p className="text-slate-600 mb-2">点击选择封面图片</p>
              <p className="text-sm text-slate-500">或拖拽图片到此处</p>
              <p className="text-xs text-slate-400 mt-2">支持 JPG、PNG 格式，最大 5MB</p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleCoverSelect(e.target.files[0])}
            className="hidden"
          />
          
          {coverError && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600">
              <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{coverError}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-4 border-b border-slate-200">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入文章标题" className="w-full text-2xl font-bold text-slate-800 border-none outline-none focus:ring-0 placeholder-slate-400" />
          </div>
          <div className="p-4">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="写点什么..." rows={20} className="w-full text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400 resize-none text-lg leading-relaxed" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => navigate('/community')} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">取消</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '发布中...' : '发布'}</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityCreateArticlePage;


