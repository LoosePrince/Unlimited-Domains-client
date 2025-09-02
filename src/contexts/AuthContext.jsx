import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 检查token有效性并获取用户信息
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success) {
            setUser(response.data.user);
          } else {
            // 只有在后端明确返回token无效时才清理登录状态
            if (response.code && (
              response.code === 'TOKEN_INVALID' ||
              response.code === 'TOKEN_MISSING' ||
              response.code === 'ACCOUNT_BANNED'
            )) {
              console.log('Token无效，清理登录状态:', response.code, response.message);
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
            } else {
              // 其他错误（如网络问题）不清理登录状态
              console.log('Token验证遇到非认证错误，保持登录状态:', response.code, response.message);
              setUser(null); // 但不设置用户信息
            }
          }
        } catch (error) {
          // 网络错误或其他异常不清理登录状态
          console.error('Token验证遇到异常，保持登录状态:', error);

          // 如果是网络错误且重试次数少于3次，延迟重试
          if (retryCount < 3 && (
            error.message.includes('Network Error') ||
            error.message.includes('timeout') ||
            !error.response
          )) {
            console.log(`网络错误，${2}秒后重试 (${retryCount + 1}/3)`);
            setTimeout(() => checkAuth(retryCount + 1), 2000);
            return; // 不设置loading为false，等待重试
          }

          // 不清除token，保持登录状态
        } finally {
          // 只有在初始调用或重试结束时才设置loading为false
          if (retryCount === 0 || retryCount >= 3) {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };

    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  // 登录
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(email, password, rememberMe);
      if (response.success) {
        const { user: userData, token: newToken } = response.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请稍后重试'
      };
    }
  };

  // 注册
  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register(username, email, password);
      if (response.success) {
        const { user: userData, token: newToken } = response.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '注册失败，请稍后重试'
      };
    }
  };

  // 登出
  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  // 刷新token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      if (response.success) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Token刷新失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Token刷新失败'
      };
    }
  };

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
