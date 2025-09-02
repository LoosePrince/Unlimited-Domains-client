import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../components/Modal';
import { getArticleDetail, getArticleComments, postArticleComment, toggleArticleLike, toggleArticleFavorite, reportArticle, likeComment, reportComment } from '../services/communityAPI';
import { IconThumbUp, IconStar, IconFlag, IconMessageCircle } from '@tabler/icons-react';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';

const CommunityArticlePage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const modal = useModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [article, setArticle] = useState(null);
  const [metrics, setMetrics] = useState({ likes: 0, comments: 0, favorites: 0, shares: 0 });
  const [userState, setUserState] = useState({ liked: false, favorited: false });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState('article'); // 'article' | 'comment'
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  const reload = async () => {
    setLoading(true);
    const detail = await getArticleDetail(id);
    if (!detail.success) {
      setError(detail.message || '加载失败');
      setLoading(false);
      return;
    }
    setArticle(detail.article);
    setMetrics(detail.metrics);
    setUserState(detail.userState || { liked: false, favorited: false });
    const cl = await getArticleComments(id, 1, 50);
    setComments(cl.success ? (cl.comments || []) : []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [id]);

  const handleSubmit = async () => {
    if (!isAuthenticated) return;
    const content = commentText.trim();
    if (!content) return;
    const res = await postArticleComment(id, content);
    if (res.success) {
      setCommentText('');
      reload();
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    const res = await toggleArticleLike(id);
    if (res.success) {
      setUserState(s => ({ ...s, liked: res.liked }));
      setMetrics(m => ({ ...m, likes: res.likeCount }));
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) return;
    const res = await toggleArticleFavorite(id);
    if (res.success) {
      setUserState(s => ({ ...s, favorited: res.favorited }));
      setMetrics(m => ({ ...m, favorites: res.favoriteCount }));
    }
  };

  const openReportArticle = () => {
    if (!isAuthenticated) return;
    setReportTargetType('article');
    setReportTargetId(id);
    setReportReason('inappropriate');
    setReportDesc('');
    setReportOpen(true);
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) return;
    const res = await likeComment(commentId);
    if (res.success) {
      setComments(list => list.map(c => c.id === commentId ? { ...c, like_count: res.likeCount, liked: res.liked } : c));
    }
  };

  const openReportComment = (commentId) => {
    if (!isAuthenticated) return;
    setReportTargetType('comment');
    setReportTargetId(commentId);
    setReportReason('inappropriate');
    setReportDesc('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!isAuthenticated || !reportOpen || !reportTargetId) return;
    setReporting(true);
    let res;
    if (reportTargetType === 'article') {
      res = await reportArticle(reportTargetId, reportReason, reportDesc);
    } else {
      res = await reportComment(reportTargetId, reportReason, reportDesc);
    }
    setReporting(false);
    if (res.success) {
      setReportOpen(false);
      modal.showSuccess({
        title: '举报成功',
        message: '举报提交成功，我们会尽快处理'
      });
    } else {
      modal.showError({
        title: '举报失败',
        message: res.message || '举报失败，请稍后重试'
      });
    }
  };

  const handleFollow = async () => {
    // 后续可接入 follows API 检查/切换，这里先前端态模拟
    if (!isAuthenticated) return;
    setFollowing(s => !s);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-4 md:py-6 min-h-[calc(100vh-200px)]">
        {loading ? (
          <div className="text-center py-8 md:py-12 text-slate-500 text-sm md:text-base">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 md:py-12 text-red-600 text-sm md:text-base">{error}</div>
        ) : (
          <div className="max-w-3xl mx-auto min-h-[60vh]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <UserAvatar user={article.author} size="md" />
                <div>
                  <Link 
                    to={`/profile/${article.author?.id}`}
                    className="text-slate-800 font-medium hover:text-slate-600 transition-colors text-sm md:text-base"
                  >
                    {article.author?.username || '匿名'}
                  </Link>
                  <div className="text-xs text-slate-500">{new Date(article.created_at).toLocaleString()}</div>
                </div>
                <div className="ml-2">
                  <FollowButton targetUserId={article.author?.id} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                <button onClick={handleLike} className={`px-2 md:px-3 py-1 rounded border inline-flex items-center gap-1 ${userState.liked ? 'bg-blue-600 text-white' : 'border-slate-300 text-slate-700'}`}>
                  <IconThumbUp className="w-3 h-3 md:w-4 md:h-4" stroke={1.8} /> {metrics.likes}
                </button>
                <button onClick={handleFavorite} className={`px-2 md:px-3 py-1 rounded border inline-flex items-center gap-1 ${userState.favorited ? 'bg-amber-500 text-white' : 'border-slate-300 text-slate-700'}`}>
                  <IconStar className="w-3 h-3 md:w-4 md:h-4" stroke={1.8} /> {metrics.favorites}
                </button>
                <button onClick={openReportArticle} className="px-2 md:px-3 py-1 rounded border inline-flex items-center gap-1 border-slate-300 text-slate-700">
                  <IconFlag className="w-3 h-3 md:w-4 md:h-4" stroke={1.8} /> 举报
                </button>
              </div>
            </div>

            {/* 文章封面 */}
            {article.cover_image_url && (
              <div className="mb-4 md:mb-6">
                <img 
                  src={article.cover_image_url} 
                  alt={article.title}
                  className="w-full max-h-64 md:max-h-96 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
            
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 md:mb-4">{article.title}</h1>
            <div className="prose max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {article.content}
            </div>

            <div className="mt-8 md:mt-10">
              <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-3">评论（{metrics.comments}）</h3>
              {isAuthenticated && (
                <div className="mb-4">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={4} placeholder="发表你的看法..." className="w-full border border-slate-300 rounded-lg p-2 md:p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base" />
                  <div className="text-right mt-2">
                    <button onClick={handleSubmit} className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base">发表评论</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {(() => {
                  // 构建 ID -> 评论 映射
                  const idMap = new Map();
                  comments.forEach(c => idMap.set(c.id, c));

                  // 找到顶级评论（无 parent）并保持原顺序
                  const roots = comments.filter(c => !c.parent_comment_id);

                  // 辅助：找到某条评论的顶级祖先
                  const findRootId = (c) => {
                    let cur = c;
                    while (cur && cur.parent_comment_id && idMap.has(cur.parent_comment_id)) {
                      cur = idMap.get(cur.parent_comment_id);
                    }
                    return cur ? cur.id : c.id;
                  };

                  // 将所有非 root 的评论按其顶级祖先分组（用于单层显示）
                  const grouped = new Map();
                  comments.forEach(c => {
                    if (!c.parent_comment_id) return;
                    const rid = findRootId(c);
                    if (!grouped.has(rid)) grouped.set(rid, []);
                    grouped.get(rid).push(c);
                  });

                  const ActionBar = ({ c }) => (
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs">
                      <button onClick={() => handleLikeComment(c.id)} className={`px-1.5 md:px-2 py-1 rounded-lg border inline-flex items-center gap-1 ${c.liked ? 'bg-blue-600 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                        <IconThumbUp className="w-3 h-3" stroke={1.8} /> {c.like_count}
                      </button>
                      <button onClick={() => setReplyFor(replyFor === c.id ? null : c.id)} className="px-1.5 md:px-2 py-1 rounded-lg border inline-flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-50">
                        <IconMessageCircle className="w-3 h-3" stroke={1.8} /> 回复
                      </button>
                      <button onClick={() => openReportComment(c.id)} className="px-1.5 md:px-2 py-1 rounded-lg border inline-flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-50">
                        <IconFlag className="w-3 h-3" stroke={1.8} /> 举报
                      </button>
                    </div>
                  );

                  return roots.map(root => (
                    <div key={root.id}>
                      {/* 顶级评论 */}
                      <div className="flex items-start gap-2 md:gap-3">
                        <UserAvatar user={root} size="sm" />
                        <div className="flex-1 rounded-2xl border bg-white border-slate-200 p-2.5 md:p-3 shadow-sm">
                          {/* 手机端：垂直布局，桌面端：水平布局 */}
                          <div className="md:flex md:items-center md:justify-between">
                            <div className="text-xs md:text-sm mb-2 md:mb-0">
                              <Link 
                                to={`/profile/${root.user_id}`}
                                className="font-medium text-slate-800 mr-2 hover:text-slate-600 transition-colors"
                              >
                                {root.username}
                              </Link>
                              <span className="text-slate-400">{new Date(root.created_at).toLocaleString()}</span>
                            </div>
                            {/* 手机端隐藏，桌面端显示 */}
                            <div className="hidden md:block">
                              <ActionBar c={root} />
                            </div>
                          </div>
                          <div className="text-slate-800 whitespace-pre-wrap mt-2 leading-relaxed text-xs md:text-sm">{root.content}</div>
                          {/* 手机端：功能按钮放在内容下面 */}
                          <div className="md:hidden mt-3 pt-2 border-t border-slate-100">
                            <ActionBar c={root} />
                          </div>
                          {replyFor === root.id && (
                            <div className="mt-3">
                              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="回复内容..." className="w-full border border-slate-300 rounded-xl p-2 md:p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs md:text-sm" />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setReplyFor(null); setReplyText(''); }} className="px-2 md:px-3 py-1 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs md:text-sm">取消</button>
                                <button onClick={async () => { if (!replyText.trim()) return; const res = await postArticleComment(id, replyText.trim(), root.id); if (res.success) { setReplyText(''); setReplyFor(null); reload(); } }} className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs md:text-sm">发送</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 单层子回复（包含对子回复的回复），统一缩进一次 */}
                      <div className="ml-6 md:ml-8 mt-2 md:mt-3 space-y-2 md:space-y-3">
                        {(grouped.get(root.id) || []).map(child => {
                          const parent = idMap.get(child.parent_comment_id);
                          const prefix = parent && parent.id !== root.id ? `回复 @${parent.username}：` : '';
                          return (
                            <div key={child.id} className="flex items-start gap-2 md:gap-3">
                              <UserAvatar user={child} size="xs" />
                              <div className="flex-1 rounded-2xl border bg-slate-50 border-slate-200 p-2.5 md:p-3">
                                {/* 手机端：垂直布局，桌面端：水平布局 */}
                                <div className="md:flex md:items-center md:justify-between">
                                  <div className="text-xs mb-2 md:mb-0">
                                    <Link 
                                      to={`/profile/${child.user_id}`}
                                      className="font-medium text-slate-800 mr-2 hover:text-slate-600 transition-colors"
                                    >
                                      {child.username}
                                    </Link>
                                    <span className="text-slate-400">{new Date(child.created_at).toLocaleString()}</span>
                                  </div>
                                  {/* 手机端隐藏，桌面端显示 */}
                                  <div className="hidden md:block">
                                    <ActionBar c={child} />
                                  </div>
                                </div>
                                <div className="text-slate-800 whitespace-pre-wrap mt-2 leading-relaxed text-xs">
                                  {prefix}{child.content}
                                </div>
                                {/* 手机端：功能按钮放在内容下面 */}
                                <div className="md:hidden mt-3 pt-2 border-t border-slate-100">
                                  <ActionBar c={child} />
                                </div>
                                {replyFor === child.id && (
                                  <div className="mt-3">
                                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="回复内容..." className="w-full border border-slate-300 rounded-xl p-2 md:p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs md:text-sm" />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button onClick={() => { setReplyFor(null); setReplyText(''); }} className="px-2 md:px-3 py-1 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs md:text-sm">取消</button>
                                      <button onClick={async () => { if (!replyText.trim()) return; const res = await postArticleComment(id, replyText.trim(), child.id); if (res.success) { setReplyText(''); setReplyFor(null); reload(); } }} className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs md:text-sm">发送</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      {reportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">{reportTargetType === 'article' ? '举报文章' : '举报评论'}</h3>
            <div className="space-y-3">
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2">
                <option value="inappropriate">不当内容</option>
                <option value="spam">垃圾信息</option>
                <option value="abuse">辱骂/人身攻击</option>
                <option value="copyright">版权问题</option>
                <option value="other">其它</option>
              </select>
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} rows={5} placeholder="请简要描述问题..." className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReportOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={submitReport} disabled={reporting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{reporting ? '提交中...' : '提交举报'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityArticlePage;


