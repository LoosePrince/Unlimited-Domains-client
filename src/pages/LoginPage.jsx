import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateForm, validateField } from '../utils/validation';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 实时验证
    if (touched[name]) {
      const validation = validateField(name, value, formData);
      setFieldErrors(prev => ({
        ...prev,
        [name]: validation.isValid ? '' : validation.message
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const validation = validateField(name, value, formData);
    setFieldErrors(prev => ({
      ...prev,
      [name]: validation.isValid ? '' : validation.message
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端验证
    const validation = validateForm(formData, 'login');
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      {/* 装饰元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ornament absolute top-20 left-20 w-16 h-16 opacity-30"></div>
        <div className="ornament absolute top-40 right-32 w-12 h-12 opacity-20"></div>
        <div className="ornament absolute bottom-32 left-32 w-20 h-20 opacity-25"></div>
        <div className="ornament absolute bottom-20 right-20 w-14 h-14 opacity-30"></div>

        {/* 几何装饰 */}
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-slate-300 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-16 w-1 h-1 bg-slate-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-slate-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-slate-300 rounded-full opacity-40"></div>
      </div>

      {/* 主要内容 */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* 电脑端布局 */}
        <div className="hidden lg:flex w-full max-w-6xl">
          {/* 左侧装饰区域 */}
          <div className="w-1/2 flex items-center justify-center relative">
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-6xl font-light text-slate-700 mb-4 text-glow">无限域</h1>
                <p className="text-xl text-slate-600 font-light">站在巨人的肩膀上，创建独属于你的故事</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                </div>
                <p className="text-slate-500 text-sm">探索无限可能的故事世界</p>

                {/* 装饰线条 */}
                <div className="flex justify-center">
                  <div className="w-20 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                </div>

                {/* 特色功能展示 */}
                <div className="grid grid-cols-2 gap-4 text-left max-w-xs mx-auto">
                  <div className="flex items-center space-x-2 justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-xs text-slate-600">分支创作</span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-xs text-slate-600">无限可能</span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-xs text-slate-600">社区互动</span>
                  </div>
                  <div className="flex items-center space-x-2 justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-xs text-slate-600">自由阅读</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧表单区域 */}
          <div className="w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 card-shadow">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-medium text-slate-700 mb-2">欢迎回来</h2>
                  <p className="text-slate-500">登录您的无限域账户</p>
                </div>

                {error && (
                  <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${fieldErrors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                        }`}
                      placeholder="请输入邮箱"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${fieldErrors.password
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                        }`}
                      placeholder="请输入密码"
                    />
                    {fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                      />
                      <span className="ml-2 text-sm text-slate-600">记住我</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                      忘记密码？
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '登录中...' : '登录'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-500">
                    还没有账户？
                    <Link to="/register" className="text-slate-700 font-medium hover:text-slate-900 transition-colors ml-1">
                      立即注册
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 手机端布局 */}
        <div className="lg:hidden w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-slate-700 mb-2 text-glow">无限域</h1>
            <p className="text-slate-600 font-light">站在巨人的肩膀上，创建独属于你的故事</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-shadow">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-medium text-slate-700 mb-1">欢迎回来</h2>
              <p className="text-slate-500 text-sm">登录您的无限域账户</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${fieldErrors.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                    }`}
                  placeholder="请输入邮箱"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${fieldErrors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                    }`}
                  placeholder="请输入密码"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                  />
                  <span className="ml-2 text-sm text-slate-600">记住我</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                还没有账户？
                <Link to="/register" className="text-slate-700 font-medium hover:text-slate-900 transition-colors ml-1">
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
