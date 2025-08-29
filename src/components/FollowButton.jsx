import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const FollowButton = ({ targetUserId, className = '', size = 'md' }) => {
    const { user, token } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [followCount, setFollowCount] = useState(0);

    // 检查是否关注
    useEffect(() => {
        if (user && targetUserId) {
            checkFollowStatus();
            getFollowCounts();
        }
    }, [user, targetUserId]);

    const checkFollowStatus = async () => {
        try {
            const response = await fetch(`/api/follows/check/${targetUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error('检查关注状态失败:', error);
        }
    };

    const getFollowCounts = async () => {
        try {
            const response = await fetch(`/api/follows/counts/${targetUserId}`);
            const data = await response.json();
            if (data.success) {
                setFollowCount(data.data.followers);
            }
        } catch (error) {
            console.error('获取关注数量失败:', error);
        }
    };

    const handleFollow = async () => {
        if (!user) {
            alert('请先登录');
            return;
        }

        if (user.id === targetUserId) {
            alert('不能关注自己');
            return;
        }

        setIsLoading(true);
        try {
            const url = isFollowing ? '/api/follows/unfollow' : '/api/follows/follow';
            const method = isFollowing ? 'DELETE' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId })
            });

            const data = await response.json();
            if (data.success) {
                setIsFollowing(!isFollowing);
                // 更新关注数量
                if (isFollowing) {
                    setFollowCount(prev => Math.max(0, prev - 1));
                } else {
                    setFollowCount(prev => prev + 1);
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败，请稍后重试');
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
