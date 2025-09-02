import React from 'react';
import {
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconLoader
} from '@tabler/icons-react';

const Modal = ({
  modalType,
  type,
  title,
  message,
  children,
  confirmText,
  cancelText,
  showCancel,
  onConfirm,
  onCancel,
  onClose,
  confirmDisabled,
  loading,
  closable,
  darkMode = false // 新增夜间模式参数
}) => {
  // 获取图标和颜色
  const getTypeConfig = (alertType) => {
    const configs = {
      success: {
        icon: IconCheck,
        iconColor: darkMode ? 'text-green-400' : 'text-green-600',
        iconBg: darkMode ? 'bg-green-900/30' : 'bg-green-100',
        buttonColor: darkMode ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
      },
      warning: {
        icon: IconAlertTriangle,
        iconColor: darkMode ? 'text-yellow-400' : 'text-yellow-600',
        iconBg: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
        buttonColor: darkMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-600 hover:bg-yellow-700'
      },
      error: {
        icon: IconAlertCircle,
        iconColor: darkMode ? 'text-red-400' : 'text-red-600',
        iconBg: darkMode ? 'bg-red-900/30' : 'bg-red-100',
        buttonColor: darkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'
      },
      info: {
        icon: IconInfoCircle,
        iconColor: darkMode ? 'text-blue-400' : 'text-blue-600',
        iconBg: darkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        buttonColor: darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
      }
    };
    return configs[alertType] || configs.info;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closable && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closable && onClose) {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closable, onClose]);

  // 阻止滚动
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {modalType === 'alert' && (
          <>
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                {type && (() => {
                  const config = getTypeConfig(type);
                  const IconComponent = config.icon;
                  return (
                    <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${config.iconColor}`} stroke={2} />
                    </div>
                  );
                })()}
                <div>
                  {title && <h3 className={`text-lg font-semibold ${
                    darkMode ? 'text-slate-100' : 'text-slate-800'
                  }`}>{title}</h3>}
                </div>
              </div>
              {closable && onClose && (
                <button
                  onClick={onClose}
                  className={`transition-colors ${
                    darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <IconX className="w-5 h-5" stroke={2} />
                </button>
              )}
            </div>

            {/* 内容 */}
            <div className="px-6 pb-6">
              {message && (
                <p className={`leading-relaxed mb-6 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>{message}</p>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 justify-end">
                {showCancel && (
                  <button
                    onClick={onCancel}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                    type ? getTypeConfig(type).buttonColor : (darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700')
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </>
        )}

        {modalType === 'form' && (
          <>
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 pb-4 border-b ${
              darkMode ? 'border-slate-600' : 'border-slate-100'
            }`}>
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-slate-100' : 'text-slate-800'
              }`}>{title}</h3>
              {closable && onClose && (
                <button
                  onClick={onClose}
                  className={`transition-colors ${
                    darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <IconX className="w-5 h-5" stroke={2} />
                </button>
              )}
            </div>

            {/* 表单内容 */}
            <div className="p-6">
              {children}
            </div>

            {/* 底部按钮 */}
            <div className={`flex gap-3 justify-end p-6 pt-4 border-t ${
              darkMode ? 'border-slate-600' : 'border-slate-100'
            }`}>
              <button
                onClick={onCancel}
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={confirmDisabled || loading}
                className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading && <IconLoader className="w-4 h-4 animate-spin" stroke={2} />}
                {confirmText}
              </button>
            </div>
          </>
        )}

        {modalType === 'status' && (
          <div className="p-8 text-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;