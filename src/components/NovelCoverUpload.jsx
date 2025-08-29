import React, { useState, useRef } from 'react';
import { IconUpload, IconX, IconPhoto, IconAlertCircle } from '@tabler/icons-react';

const NovelCoverUpload = ({ 
  currentCoverUrl, 
  onCoverChange, 
  disabled = false,
  className = '',
  hasExistingCover = false,
  hasOtherContributors = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 验证图片尺寸和比例
  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        
        // 检查最小尺寸
        if (width < 150 || height < 200) {
          reject('图片尺寸太小，最小需要 150x200 像素');
          return;
        }
        
        // 检查最大尺寸
        if (width > 600 || height > 800) {
          reject('图片尺寸太大，最大不能超过 600x800 像素');
          return;
        }
        
        // 检查比例是否为 3:4
        const ratio = width / height;
        const targetRatio = 3 / 4;
        const tolerance = 0.1; // 允许一定的误差
        
        if (Math.abs(ratio - targetRatio) > tolerance) {
          reject('图片比例不正确，需要是 3:4 的比例');
          return;
        }
        
        resolve();
      };
      img.onerror = () => reject('图片加载失败');
      img.src = URL.createObjectURL(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    
    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片文件太大，最大不能超过 5MB');
      return;
    }
    
    try {
      setError('');
      
      // 验证图片尺寸和比例
      await validateImage(file);
      
      // 创建预览
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // 调用父组件的回调
      if (onCoverChange) {
        console.log('NovelCoverUpload: 调用 onCoverChange 回调，文件:', file.name, '预览URL:', url);
        onCoverChange(file, url);
      }
      
    } catch (error) {
      setError(error.message || '图片验证失败');
    }
  };

  // 处理拖拽
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 处理拖拽放下
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !(hasOtherContributors && hasExistingCover)) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0] && !(hasOtherContributors && hasExistingCover)) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // 移除封面
  const handleRemoveCover = () => {
    setPreviewUrl(null);
    if (onCoverChange) {
      onCoverChange(null, null);
    }
  };

  // 显示当前封面或预览
  const displayUrl = previewUrl || currentCoverUrl;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          小说封面
        </label>
        {!disabled && displayUrl && !(hasOtherContributors && hasExistingCover) && (
          <div className="flex items-center justify-center mb-3">
            <button
              type="button"
              onClick={handleRemoveCover}
              className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
              移除封面
            </button>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

             {/* 拖拽区域 */}
       <div
         className={`relative border-2 border-dashed rounded-lg transition-colors mx-auto ${
           dragActive 
             ? 'border-blue-400 bg-blue-50' 
             : 'border-slate-300 hover:border-slate-400'
         } ${(disabled || (hasOtherContributors && hasExistingCover)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
         style={{ aspectRatio: '3/4', width: '120px' }}
         onDragEnter={handleDrag}
         onDragLeave={handleDrag}
         onDragOver={handleDrag}
         onDrop={handleDrop}
         onClick={() => !disabled && !(hasOtherContributors && hasExistingCover) && fileInputRef.current?.click()}
       >
         {displayUrl ? (
           // 显示封面预览
           <div className="flex flex-col items-center justify-center h-full p-2">
             <div className="relative w-full h-full">
               <img
                 src={displayUrl}
                 alt="小说封面"
                 className="w-full h-full object-cover rounded-lg shadow-md"
               />
               {!disabled && !(hasOtherContributors && hasExistingCover) && (
                 <button
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     handleRemoveCover();
                   }}
                   className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                 >
                   <IconX className="w-4 h-4" stroke={2} />
                 </button>
               )}
             </div>
           </div>
         ) : (
           // 显示上传提示
           <div className="flex flex-col items-center justify-center h-full p-3 text-center">
             <IconPhoto className="w-10 h-10 text-slate-400 mb-3" stroke={1.5} />
             {hasOtherContributors && hasExistingCover ? (
               <>
                 <p className="text-xs text-slate-500 mb-2">
                   已有封面
                 </p>
                 <p className="text-xs text-slate-400">
                   不可修改
                 </p>
               </>
             ) : (
               <>
                              <p className="text-xs text-slate-600 mb-2">
               点击选择封面
             </p>
                 <p className="text-xs text-slate-500">
                   3:4 比例
                 </p>
               </>
             )}
           </div>
         )}
       </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-center">
          <IconAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* 尺寸要求说明 */}
      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
        <p className="text-xs text-slate-600">
          点击选择封面，支持 JPG、PNG<br />
          3:4 比例，150x200 至 600x800 像素
        </p>
      </div>
    </div>
  );
};

export default NovelCoverUpload;
