import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';

const Toast = ({
  id,
  type,
  message,
  position = 'top-center',
  onClose,
  darkMode = false // 新增夜间模式参数
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 获取图标和样式配置
  const getTypeConfig = (toastType) => {
    const configs = {
      success: {
        icon: IconCheck,
        iconColor: darkMode ? 'text-green-400' : 'text-green-600',
        bgColor: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-green-50 border-green-200',
        textColor: darkMode ? 'text-green-300' : 'text-green-800'
      },
      warning: {
        icon: IconAlertTriangle,
        iconColor: darkMode ? 'text-yellow-400' : 'text-yellow-600',
        bgColor: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-yellow-50 border-yellow-200',
        textColor: darkMode ? 'text-yellow-300' : 'text-yellow-800'
      },
      error: {
        icon: IconAlertCircle,
        iconColor: darkMode ? 'text-red-400' : 'text-red-600',
        bgColor: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-red-50 border-red-200',
        textColor: darkMode ? 'text-red-300' : 'text-red-800'
      },
      info: {
        icon: IconInfoCircle,
        iconColor: darkMode ? 'text-blue-400' : 'text-blue-600',
        bgColor: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200',
        textColor: darkMode ? 'text-blue-300' : 'text-blue-800'
      }
    };
    return configs[toastType] || configs.info;
  };

  // 获取位置样式
  const getPositionClasses = (pos) => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'top-right': 'top-4 right-4'
    };
    return positions[pos] || positions['top-center'];
  };

  const config = getTypeConfig(type);

  // 进入动画
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 处理关闭
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 获取动画类
  const getAnimationClasses = () => {
    if (isLeaving) {
      return position.includes('top') 
        ? 'opacity-0 -translate-y-2' 
        : 'opacity-0 translate-y-2';
    }
    
    if (isVisible) {
      return 'opacity-100 translate-y-0';
    }
    
    return position.includes('top') 
      ? 'opacity-0 -translate-y-2' 
      : 'opacity-0 translate-y-2';
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out ${getPositionClasses(position)} ${getAnimationClasses()}`}
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
          max-w-sm min-w-80 
          ${config.bgColor}
        `}
      >
        {/* 图标 */}
        <div className="flex-shrink-0">
          <config.icon className={`w-5 h-5 ${config.iconColor}`} stroke={2} />
        </div>

        {/* 消息内容 */}
        <div className={`flex-1 text-sm font-medium ${config.textColor}`}>
          {message}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors ${
            darkMode ? 'text-slate-400 hover:text-slate-200' : config.textColor
          }`}
        >
          <IconX className="w-4 h-4" stroke={2} />
        </button>
      </div>
    </div>
  );
};

export default Toast;