import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  getChapterComments, 
  createChapterComment, 
  getCommentReplies, 
  deleteComment,
  toggleCommentLike,
  reportComment 
} from '../services/novelAPI';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import FollowButton from './FollowButton';
import UserAvatar from './UserAvatar';

const ChapterComments = ({ novelId, chapterId, isDark = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [commentReplies, setCommentReplies] = useState({});
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [novelId, chapterId]);

  const fetchComments = async () => {
    console.log('开始获取评论:', { novelId, chapterId });
    setLoading(true);
    try {
      const result = await getChapterComments(novelId, chapterId);
      console.log('获取评论结果:', result);
      if (result.success) {
        console.log('设置评论列表，共', result.comments.length, '条评论');
        setComments(result.comments);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await createChapterComment(novelId, chapterId, newComment.trim());
      if (result.success) {
        setNewComment('');
        fetchComments(); // 重新获取评论列表
      } else {
        alert(result.message || '评论发布失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const result = await createChapterComment(novelId, chapterId, replyContent.trim(), parentCommentId);
      if (result.success) {
        setReplyContent('');
        setReplyingTo(null);
        
        // 更新主评论的回复数量
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              reply_count: parseInt(comment.reply_count || 0) + 1
            };
          }
          return comment;
        }));
        
        // 重新获取该评论的回复
        fetchReplies(parentCommentId);
      } else {
        alert(result.message || '回复发布失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      const result = await getCommentReplies(commentId);
      if (result.success) {
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: result.replies
        }));
      }
    } catch (error) {
      console.error('获取回复失败:', error);
    }
  };

  const toggleReplies = async (commentId) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setExpandedReplies(prev => new Set([...prev, commentId]));
      if (!commentReplies[commentId]) {
        await fetchReplies(commentId);
      }
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      const result = await toggleCommentLike(commentId);
      if (result.success) {
        // 更新评论的点赞状态
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: result.action === 'like',
              like_count: result.action === 'like' 
                ? comment.like_count + 1 
                : comment.like_count - 1
            };
          }
          return comment;
        }));

        // 同时更新回复中的点赞状态
        setCommentReplies(prev => {
          const newReplies = { ...prev };
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parentId] = newReplies[parentId].map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  is_liked: result.action === 'like',
                  like_count: result.action === 'like' 
                    ? reply.like_count + 1 
                    : reply.like_count - 1
                };
              }
              return reply;
            });
          });
          return newReplies;
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleDeleteComment = (commentId, isReply = false, parentCommentId = null) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    // 设置删除弹窗状态
    setDeleteTarget({ commentId, isReply, parentCommentId });
    setDeleteModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteTarget) return;

    const { commentId, isReply, parentCommentId } = deleteTarget;
    console.log('开始删除评论:', { commentId, isReply, parentCommentId });

    try {
      const result = await deleteComment(commentId);
      console.log('删除评论API结果:', result);
      
      if (result.success) {
        console.log('删除成功，开始更新UI');
        
        // 关闭删除弹窗
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        
        if (isReply && parentCommentId) {
          console.log('删除的是回复，更新父评论回复数量');
          // 如果删除的是回复，更新父评论的回复数量
          setComments(prev => prev.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                reply_count: Math.max(parseInt(comment.reply_count || 1) - 1, 0)
              };
            }
            return comment;
          }));
          
          // 重新获取该评论的回复列表
          console.log('重新获取回复列表');
          await fetchReplies(parentCommentId);
        } else {
          console.log('删除的是主评论，重新获取所有评论');
          // 如果删除的是主评论，重新获取所有评论
          await fetchComments();
        }
        
        console.log('评论删除完成');
      } else {
        console.error('删除失败:', result.message);
        setDeleteModalOpen(false);
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error('删除评论网络错误:', error);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleReportComment = async (commentId, reason, description) => {
    try {
      const result = await reportComment(commentId, reason, description);
      if (result.success) {
        alert('举报提交成功，我们会尽快处理');
        setReportModalOpen(false);
        setReportTarget(null);
      } else {
        alert(result.message || '举报失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    }
  };

  const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const reasons = ['违法违规', '色情低俗', '广告垃圾', '恶意骚扰', '侵犯版权', '其他'];

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!reason) {
        alert('请选择举报原因');
        return;
      }
      onSubmit(reason, description);
      setReason('');
      setDescription('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>举报评论</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                举报原因 *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full p-2 border rounded-md ${isDark ? 'text-slate-100 border-slate-600' : 'border-gray-300'}`}
                style={isDark ? { backgroundColor: '#1a2223', borderColor: '#374151' } : {}}
                required
              >
                <option value="">请选择原因</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                详细描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-2 border rounded-md ${isDark ? 'text-slate-100 border-slate-600' : 'border-gray-300'}`}
                style={isDark ? { backgroundColor: '#1a2223', borderColor: '#374151' } : {}}
                rows="3"
                placeholder="请描述具体问题..."
                maxLength="500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 border rounded-md ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}
                style={isDark ? { backgroundColor: '#1a2223' } : {}}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                提交举报
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]" style={isDark ? { backgroundColor: '#1f2937', borderColor: '#374151' } : {}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>确认删除</h3>
            <button
              onClick={onClose}
              className={`text-xl hover:opacity-75 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ×
            </button>
          </div>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            确定要删除这条评论吗？删除后无法恢复。
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded-md transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              style={isDark ? { backgroundColor: '#374151' } : {}}
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CommentItem = useCallback(({ comment, isReply = false }) => {
    
    return (
      <div className={`${isReply ? 'ml-6 border-l-2 pl-3' : ''}`} style={{
        borderColor: isReply ? (isDark ? '#4b5563' : '#e5e7eb') : 'transparent'
      }}>
        <div className="flex items-start space-x-2">
          <UserAvatar 
            user={{
              username: comment.username,
              avatar_url: comment.avatar_url || null
            }} 
            size="xs" 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {comment.user_id ? (
                <Link
                  to={`/profile/${comment.user_id}`}
                  className="font-medium text-sm hover:text-blue-600 transition-colors"
                  style={{ 
                    color: isDark ? '#f3f4f6' : '#1f2937'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {comment.username || '匿名用户'}
                </Link>
              ) : (
                <span className="font-medium text-sm" style={{ 
                  color: isDark ? '#f3f4f6' : '#1f2937'
                }}>{comment.username || '匿名用户'}</span>
              )}
              {comment.user_id && (
                <FollowButton 
                  targetUserId={comment.user_id} 
                  size="sm" 
                  className="ml-2"
                />
              )}
              <span className="text-xs" style={{ 
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm mb-2" style={{ 
              color: isDark ? '#e5e7eb' : '#374151'
            }}>{comment.content}</p>
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center space-x-1 hover:opacity-75 ${
                  comment.is_liked ? 'text-red-500' : ''
                }`}
                style={{ 
                  color: comment.is_liked ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280')
                }}
              >
                {/* 评论点赞图标（SVG） */}
                {comment.is_liked ? (
                  <IconHeartFilled className="w-3.5 h-3.5" />
                ) : (
                  <IconHeart className="w-3.5 h-3.5" />
                )}
                <span>{comment.like_count || 0}</span>
              </button>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="hover:opacity-75"
                  style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
                >
                  回复
                </button>
              )}
              {!isReply && parseInt(comment.reply_count) > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="hover:opacity-75"
                  style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
                >
                  {expandedReplies.has(comment.id) ? '收起' : '查看'} {parseInt(comment.reply_count) || 0} 条回复
                </button>
              )}
              {/* 删除按钮 - 只有评论作者可以删除 */}
              {comment.user_id === user?.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id, isReply, isReply ? comment.parent_comment_id : null)}
                  className="hover:opacity-75 text-red-500 hover:text-red-600"
                >
                  删除
                </button>
              )}
              <button
                onClick={() => {
                  setReportTarget(comment.id);
                  setReportModalOpen(true);
                }}
                className="hover:opacity-75"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                举报
              </button>
            </div>
          </div>
        </div>

        {/* 展开的回复列表 */}
        {expandedReplies.has(comment.id) && commentReplies[comment.id] && (
          <div className="mt-2">
            {commentReplies[comment.id].map(reply => (
              <div key={reply.id} className="mb-2">
                <CommentItem comment={{...reply, parent_comment_id: comment.id}} isReply={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [isDark, expandedReplies, commentReplies, handleLikeComment, toggleReplies, setReportTarget, setReportModalOpen, handleDeleteComment, user]);

  return (
    <div className="rounded-lg shadow-sm border p-4" style={{ 
      backgroundColor: isDark ? '#1f2937' : 'white',
      borderColor: isDark ? '#374151' : '#d1d5db'
    }}>
      <h3 className="text-base font-semibold mb-3" style={{ 
        color: isDark ? '#f9fafb' : '#1f2937'
      }}>
        已有 {comments.length} 条评论
      </h3>

      {/* 发表评论 */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-md resize-none text-sm"
            style={{
              backgroundColor: isDark ? '#374151' : 'white',
              borderColor: isDark ? '#4b5563' : '#d1d5db',
              color: isDark ? '#f9fafb' : '#1f2937'
            }}
            rows="2"
            placeholder="写下你的评论..."
            maxLength="1000"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs" style={{ 
              color: isDark ? '#9ca3af' : '#6b7280'
            }}>
              {newComment.length}/1000
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? '发布中...' : '发布'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4 p-3 rounded-md text-center text-sm" style={{
          backgroundColor: isDark ? '#374151' : '#f9fafb',
          color: isDark ? '#d1d5db' : '#6b7280'
        }}>
          <p>请先登录后参与评论</p>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-4">
          <div className="text-sm" style={{ 
            color: isDark ? '#9ca3af' : '#6b7280'
          }}>加载评论中...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-sm" style={{ 
            color: isDark ? '#9ca3af' : '#6b7280'
          }}>暂无评论，快来抢沙发吧！</div>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              
              {/* 回复表单 - 放在CommentItem外部，避免重新渲染 */}
              {replyingTo === comment.id && (
                <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-2 ml-8">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full p-2 border rounded-md resize-none text-sm"
                    style={{
                      backgroundColor: isDark ? '#374151' : 'white',
                      borderColor: isDark ? '#4b5563' : '#d1d5db',
                      color: isDark ? '#f9fafb' : '#1f2937'
                    }}
                    rows="2"
                    placeholder="写下你的回复..."
                    maxLength="1000"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      type="submit"
                      disabled={submitting || !replyContent.trim()}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? '发布中...' : '回复'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="px-2 py-1 border rounded text-xs hover:opacity-75"
                      style={{
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        color: isDark ? '#d1d5db' : '#6b7280',
                        backgroundColor: isDark ? '#374151' : 'white'
                      }}
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 举报模态框 */}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportTarget(null);
        }}
        onSubmit={(reason, description) => handleReportComment(reportTarget, reason, description)}
      />

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteComment}
      />
    </div>
  );
};

export default ChapterComments;
