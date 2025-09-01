import React from 'react';
import { Link } from 'react-router-dom';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showUsername = false,
  linkToProfile = false 
}) => {
  // 尺寸映射
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
    '3xl': 'w-24 h-24 text-2xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // 头像元素
  const avatarElement = (
    <div className={`${sizeClass} bg-slate-300 rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {user?.avatar_url && user.avatar_url !== 'none' ? (
        <img
          src={user.avatar_url}
          alt={user?.username || '用户头像'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-slate-600 font-medium">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );

  // 如果不需要链接到个人资料，直接返回头像
  if (!linkToProfile || !user?.id) {
    return (
      <div className="flex items-center gap-2">
        {avatarElement}
        {showUsername && user?.username && (
          <span className="text-slate-700">{user.username}</span>
        )}
      </div>
    );
  }

  // 如果需要链接到个人资料，包装在Link中
  return (
    <Link 
      to={`/profile/${user.id}`}
      className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
    >
      {avatarElement}
      {showUsername && user?.username && (
        <span className="text-slate-700">{user.username}</span>
      )}
    </Link>
  );
};

export default UserAvatar;
