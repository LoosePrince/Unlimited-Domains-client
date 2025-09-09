import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from './Modal';
import api from '../services/authAPI';

// 全局缓存，避免重复请求
const followStatusCache = new Map();
const followCountCache = new Map();
const pendingRequests = new Map();

const FollowButton = ({ targetUserId, className = '', size = 'md' }) => {
    const { user, token } = useAuth();
    const modal = useModal();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [followCount, setFollowCount] = useState(0);
    const mountedRef = useRef(true);
    const debounceTimerRef = useRef(null);

    // 防抖函数
    const debounce = useCallback((func, delay) => {
        return (...args) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                if (mountedRef.current) {
                    func(...args);
                }
            }, delay);
        };
    }, []);

    // 检查是否关注（带缓存和防重复请求）
    const checkFollowStatus = useCallback(async () => {
        if (!user || !targetUserId) return;

        const cacheKey = `${user.id}-${targetUserId}`;
        
        // 检查缓存
        if (followStatusCache.has(cacheKey)) {
            const cachedData = followStatusCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 30000) { // 30秒缓存
                setIsFollowing(cachedData.isFollowing);
                return;
            }
        }

        // 检查是否有正在进行的请求
        if (pendingRequests.has(cacheKey)) {
            return;
        }

        try {
            pendingRequests.set(cacheKey, true);
            const data = await api.get(`/follows/check/${targetUserId}`);
            if (data.success && mountedRef.current) {
                setIsFollowing(data.isFollowing);
                // 更新缓存
                followStatusCache.set(cacheKey, {
                    isFollowing: data.isFollowing,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('检查关注状态失败:', error);
        } finally {
            pendingRequests.delete(cacheKey);
        }
    }, [user, targetUserId]);

    // 获取关注数量（带缓存和防重复请求）
    const getFollowCounts = useCallback(async () => {
        if (!targetUserId) return;

        const cacheKey = `count-${targetUserId}`;
        
        // 检查缓存
        if (followCountCache.has(cacheKey)) {
            const cachedData = followCountCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 60000) { // 60秒缓存
                setFollowCount(cachedData.count);
                return;
            }
        }

        // 检查是否有正在进行的请求
        if (pendingRequests.has(cacheKey)) {
            return;
        }

        try {
            pendingRequests.set(cacheKey, true);
            const data = await api.get(`/follows/counts/${targetUserId}`);
            if (data.success && mountedRef.current) {
                setFollowCount(data.data.followers);
                // 更新缓存
                followCountCache.set(cacheKey, {
                    count: data.data.followers,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('获取关注数量失败:', error);
        } finally {
            pendingRequests.delete(cacheKey);
        }
    }, [targetUserId]);

    // 防抖的检查函数
    const debouncedCheckFollowStatus = useCallback(
        debounce(checkFollowStatus, 300),
        [checkFollowStatus, debounce]
    );

    const debouncedGetFollowCounts = useCallback(
        debounce(getFollowCounts, 300),
        [getFollowCounts, debounce]
    );

    // 检查是否关注
    useEffect(() => {
        if (user && targetUserId) {
            debouncedCheckFollowStatus();
            debouncedGetFollowCounts();
        }
    }, [user, targetUserId, debouncedCheckFollowStatus, debouncedGetFollowCounts]);

    // 清理函数
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleFollow = async () => {
        if (!user) {
            modal.showWarning({
                title: '登录提示',
                message: '请先登录后再关注'
            });
            return;
        }

        if (user.id === targetUserId) {
            modal.showWarning({
                title: '操作提示',
                message: '不能关注自己'
            });
            return;
        }

        setIsLoading(true);
        try {
            const data = await api({
                method: isFollowing ? 'DELETE' : 'POST',
                url: `/follows/${isFollowing ? 'unfollow' : 'follow'}`,
                data: { targetUserId }
            });

            if (data.success) {
                const newFollowingStatus = !isFollowing;
                setIsFollowing(newFollowingStatus);
                
                // 更新关注数量
                const newFollowCount = isFollowing 
                    ? Math.max(0, followCount - 1) 
                    : followCount + 1;
                setFollowCount(newFollowCount);

                // 更新缓存
                const cacheKey = `${user.id}-${targetUserId}`;
                followStatusCache.set(cacheKey, {
                    isFollowing: newFollowingStatus,
                    timestamp: Date.now()
                });

                const countCacheKey = `count-${targetUserId}`;
                followCountCache.set(countCacheKey, {
                    count: newFollowCount,
                    timestamp: Date.now()
                });
            } else {
                modal.showError({
                    title: '操作失败',
                    message: data.message || '操作失败，请稍后重试'
                });
            }
        } catch (error) {
            console.error('操作失败:', error);
            modal.showError({
                title: '网络错误',
                message: '网络连接失败，请检查网络后重试'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 如果未登录或关注自己，不显示按钮
    if (!user || user.id === targetUserId) {
        return null;
    }

    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleFollow}
                disabled={isLoading}
                className={`
                    ${sizeClasses[size]}
                    rounded-full font-medium transition-all duration-200
                    ${isFollowing 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${className}
                `}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {isFollowing ? '取消中...' : '关注中...'}
                    </span>
                ) : (
                    isFollowing ? '已关注' : '关注'
                )}
            </button>
            {followCount > 0 && (
                <span className="text-sm text-gray-500">
                    {followCount} 个粉丝
                </span>
            )}
        </div>
    );
};

export default FollowButton;
