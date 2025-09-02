import React, { createContext, useContext, useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);
  const [toasts, setToasts] = useState([]);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 普通弹窗
  const showAlert = ({
    type = 'info', // 'success' | 'warning' | 'error' | 'info'
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    showCancel = false,
    onConfirm,
    onCancel,
    closable = true,
    darkMode = false // 新增夜间模式参数
  }) => {
    const id = generateId();
    const modal = {
      id,
      type: 'alert',
      props: {
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancel,
        darkMode,
        onConfirm: () => {
          onConfirm?.();
          closeModal(id);
        },
        onCancel: () => {
          onCancel?.();
          closeModal(id);
        },
        onClose: closable ? () => closeModal(id) : undefined,
        closable
      }
    };

    setModals(prev => [...prev, modal]);
    return id;
  };

  // 表单弹窗
  const showForm = ({
    title,
    children, // 自定义表单内容
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    onCancel,
    confirmDisabled = false,
    loading = false,
    closable = true,
    darkMode = false // 新增夜间模式参数
  }) => {
    const id = generateId();
    const modal = {
      id,
      type: 'form',
      props: {
        title,
        children,
        confirmText,
        cancelText,
        darkMode,
        onConfirm: () => {
          onConfirm?.();
          // 注意：表单弹窗通常需要在onConfirm中手动关闭
        },
        onCancel: () => {
          onCancel?.();
          closeModal(id);
        },
        onClose: closable ? () => closeModal(id) : undefined,
        confirmDisabled,
        loading,
        closable
      }
    };

    setModals(prev => [...prev, modal]);
    return id;
  };

  // 状态弹窗（不可手动关闭）
  const showStatus = ({
    children, // 自定义内容，通常是loading状态
    closable = false
  }) => {
    const id = generateId();
    const modal = {
      id,
      type: 'status',
      props: {
        children,
        onClose: closable ? () => closeModal(id) : undefined,
        closable
      }
    };

    setModals(prev => [...prev, modal]);
    return id;
  };

  // 临时消息（Toast）
  const showToast = ({
    type = 'info', // 'success' | 'warning' | 'error' | 'info'
    message,
    duration = 3000,
    position = 'top-center', // 'top-left' | 'top-center' | 'top-right'
    darkMode = false // 新增夜间模式参数
  }) => {
    const id = generateId();
    const toast = {
      id,
      type,
      message,
      position,
      darkMode,
      createdAt: Date.now()
    };

    setToasts(prev => [...prev, toast]);

    // 自动关闭
    setTimeout(() => {
      closeToast(id);
    }, duration);

    return id;
  };

  // 关闭模态弹窗
  const closeModal = (id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };

  // 关闭所有模态弹窗
  const closeAllModals = () => {
    setModals([]);
  };

  // 关闭Toast
  const closeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 关闭所有Toast
  const closeAllToasts = () => {
    setToasts([]);
  };

  const value = {
    // 普通弹窗方法
    showAlert,
    showSuccess: (options) => showAlert({ ...options, type: 'success' }),
    showWarning: (options) => showAlert({ ...options, type: 'warning' }),
    showError: (options) => showAlert({ ...options, type: 'error' }),
    showInfo: (options) => showAlert({ ...options, type: 'info' }),
    
    // 确认弹窗
    showConfirm: (options) => showAlert({ ...options, showCancel: true }),
    
    // 表单弹窗
    showForm,
    
    // 状态弹窗
    showStatus,
    
    // Toast消息
    showToast,
    showSuccessToast: (message, options = {}) => showToast({ ...options, type: 'success', message }),
    showWarningToast: (message, options = {}) => showToast({ ...options, type: 'warning', message }),
    showErrorToast: (message, options = {}) => showToast({ ...options, type: 'error', message }),
    showInfoToast: (message, options = {}) => showToast({ ...options, type: 'info', message }),
    
    // 关闭方法
    closeModal,
    closeAllModals,
    closeToast,
    closeAllToasts
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      
      {/* 渲染所有模态弹窗 */}
      {modals.map(modal => (
        <Modal key={modal.id} {...modal.props} modalType={modal.type} />
      ))}
      
      {/* 渲染所有Toast */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => closeToast(toast.id)}
        />
      ))}
    </ModalContext.Provider>
  );
};