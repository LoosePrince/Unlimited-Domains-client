// 环境变量配置文件
export const config = {
  // 应用配置
  APP_NAME: import.meta.env.VITE_APP_NAME || '无限域',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // 环境配置
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  
  // API配置
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  
  // 客户端配置
  CLIENT_PORT: parseInt(import.meta.env.VITE_CLIENT_PORT) || 3001,
  
  // 路由配置
  ROUTER_MODE: import.meta.env.VITE_ROUTER_MODE || 'hash', // 'hash' 或 'browser'
  
  // 功能开关
  FEATURES: {
    DEBUG_MODE: import.meta.env.VITE_DEBUG === 'true',
    LOGGING: import.meta.env.VITE_NODE_ENV === 'development',
  }
};

// 开发环境配置
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';

// 导出默认配置
export default config;
