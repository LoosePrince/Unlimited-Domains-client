import axios from 'axios';
import config from '../config/env';

// 创建axios实例
const api = axios.create({
  baseURL: config.API_BASE_URL + '/api',
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理token过期
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 检查是否是明确的认证错误
      const errorCode = error.response.data?.code || '';
      const isAuthError = errorCode === 'TOKEN_INVALID' ||
        errorCode === 'TOKEN_MISSING' ||
        errorCode === 'ACCOUNT_BANNED';

      if (isAuthError) {
        // 明确的认证错误，尝试刷新token
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const refreshResponse = await api.post('/auth/refresh');
            if (refreshResponse.success) {
              localStorage.setItem('token', refreshResponse.data.token);
              // 重试原请求
              const originalRequest = error.config;
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // 刷新失败，清除token
            localStorage.removeItem('token');
            // 根据路由模式选择重定向方式
            if (config.ROUTER_MODE === 'hash') {
              window.location.hash = '#/login';
            } else {
              window.location.href = '/login';
            }
          }
        }
      }
      // 如果不是明确的认证错误，不处理，让业务代码决定如何处理
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // 用户注册
  register: async (username, email, password) => {
    return await api.post('/auth/register', {
      username,
      email,
      password,
      confirmPassword: password // 简化处理，实际应该分开验证
    });
  },

  // 用户登录
  login: async (email, password) => {
    return await api.post('/auth/login', {
      email,
      password
    });
  },

  // 用户登出
  logout: async () => {
    return await api.post('/auth/logout');
  },

  // 获取当前用户信息
  getMe: async () => {
    return await api.get('/auth/me');
  },

  // 刷新token
  refreshToken: async () => {
    return await api.post('/auth/refresh');
  }
};

export default api;
