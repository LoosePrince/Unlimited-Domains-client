import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { userAPI } from '../services/userAPI';

import {
  IconUser,
  IconBook2,
  IconFileText,
  IconFlag,
  IconTrendingUp,
  IconTrendingDown,
  IconLoader,
  IconShield,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    checkAdminAccess();
  }, [isAuthenticated, navigate]);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const result = await userAPI.checkAdminStatus();

      if (!result.success || !result.isAdmin) {
        setError('您没有权限访问后台管理页面');
        return;
      }

      // 获取后台数据
      await fetchDashboardData();
    } catch (error) {
      console.error('检查权限失败:', error);
      setError('检查权限失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const result = await userAPI.getAdminDashboard();
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        setError(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取后台数据失败:', error);
      setError('获取数据失败，请稍后重试');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <IconAlertTriangle className="w-4 h-4" stroke={1.8} />;
      case 'resolved':
        return <IconCheck className="w-4 h-4" stroke={1.8} />;
      case 'rejected':
        return <IconX className="w-4 h-4" stroke={1.8} />;
      default:
        return <IconFlag className="w-4 h-4" stroke={1.8} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <IconLoader className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-spin" stroke={1.8} />
            <h1 className="text-2xl font-bold text-slate-700 mb-2">加载中...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <IconShield className="w-16 h-16 text-red-400 mx-auto mb-4" stroke={1.8} />
            <h1 className="text-2xl font-bold text-slate-700 mb-2">访问被拒绝</h1>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/profile')}
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              返回个人中心
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-700 mb-2">后台管理</h1>
          <p className="text-slate-500">管理系统统计和用户报告</p>
        </div>

        {/* 统计卡片 */}
        {dashboardData?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 用户统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">总用户数</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {formatNumber(dashboardData.stats.users.total_users)}
                  </p>
                </div>
                <IconUser className="w-8 h-8 text-blue-500" stroke={1.8} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <IconTrendingUp className="w-4 h-4 text-green-500 mr-1" stroke={1.8} />
                <span className="text-green-600">
                  近7天: +{dashboardData.stats.users.new_users_week}
                </span>
              </div>
            </div>

            {/* 小说统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">总小说数</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {formatNumber(dashboardData.stats.novels.total_novels)}
                  </p>
                </div>
                <IconBook2 className="w-8 h-8 text-green-500" stroke={1.8} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <IconTrendingUp className="w-4 h-4 text-green-500 mr-1" stroke={1.8} />
                <span className="text-green-600">
                  近7天: +{dashboardData.stats.novels.new_novels_week}
                </span>
              </div>
            </div>

            {/* 文章统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">总文章数</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {formatNumber(dashboardData.stats.articles.total_articles)}
                  </p>
                </div>
                <IconFileText className="w-8 h-8 text-purple-500" stroke={1.8} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <IconTrendingUp className="w-4 h-4 text-green-500 mr-1" stroke={1.8} />
                <span className="text-green-600">
                  近7天: +{dashboardData.stats.articles.new_articles_week}
                </span>
              </div>
            </div>

            {/* 举报统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">待处理举报</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {formatNumber(dashboardData.stats.reports.pending_reports)}
                  </p>
                </div>
                <IconFlag className="w-8 h-8 text-red-500" stroke={1.8} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-600">
                  总计: {dashboardData.stats.reports.total_reports}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 最近举报 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-700">最近举报</h2>
          </div>

          <div className="p-6">
            {dashboardData?.recentReports?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">
                              {report.status === 'pending' ? '待处理' :
                               report.status === 'resolved' ? '已处理' :
                               report.status === 'rejected' ? '已拒绝' : '未知'}
                            </span>
                          </span>
                          <span className="text-sm text-slate-500">
                            {report.target_type_name}
                          </span>
                        </div>

                        <p className="text-slate-700 font-medium mb-1">
                          {report.reason}
                        </p>

                        {report.description && (
                          <p className="text-slate-600 text-sm mb-2">
                            {report.description}
                          </p>
                        )}

                        <div className="text-xs text-slate-500">
                          举报人: {report.reporter_name} |
                          {report.reported_user_name && ` 被举报人: ${report.reported_user_name} | `}
                          {formatDate(report.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconFlag className="w-12 h-12 text-slate-400 mx-auto mb-4" stroke={1.8} />
                <p className="text-slate-500">暂无举报记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;
