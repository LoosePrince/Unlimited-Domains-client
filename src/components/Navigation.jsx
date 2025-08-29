import React, { useState } from 'react';
import { IconSearch, IconMenu2 } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-light text-slate-700 text-glow">
              无限域
            </Link>
          </div>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/explore" className="text-slate-600 hover:text-slate-900 transition-colors">
              发现
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
                创作中心
              </Link>
            )}
            <Link to="/community" className="text-slate-600 hover:text-slate-900 transition-colors">
              社区
            </Link>
            <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
              关于
            </Link>
          </div>

          {/* 用户操作 */}
          <div className="flex items-center space-x-4">
            {/* 搜索输入框 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const query = e.target.search.value.trim();
                if (query) {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              className="hidden sm:block"
            >
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="搜索..."
                  className="w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <IconSearch className="w-4 h-4" stroke={1.8} />
                </button>
              </div>
            </form>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={`/profile/${user?.id}`}
                  className="hidden sm:flex items-center space-x-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
                >
                  <UserAvatar user={user} size="sm" showUsername={true} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors btn-transition btn-hover"
                >
                  注册
                </Link>
              </div>
            )}

            {/* 手机端菜单按钮 */}
            <button
              className="md:hidden text-slate-600 hover:text-slate-900 transition-colors"
              onClick={toggleMobileMenu}
            >
              <IconMenu2 className="w-6 h-6" stroke={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* 手机端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200">
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/explore"
              className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              发现
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                创作中心
              </Link>
            )}
            <Link
              to="/community"
              className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              社区
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              关于
            </Link>

            {isAuthenticated ? (
              <div className="border-t border-slate-200 pt-2 mt-2">
                <Link
                  to={`/profile/${user?.id}`}
                  className="px-3 py-2 flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserAvatar user={user} size="sm" showUsername={true} />
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-slate-700 text-white hover:bg-slate-800 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
