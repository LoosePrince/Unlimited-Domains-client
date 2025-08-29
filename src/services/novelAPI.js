import axios from 'axios';

const API_BASE_URL = '/api/novels';

// 创建小说
export const createNovel = async (novelData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/create`, novelData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取用户的小说列表
export const getMyNovels = async (page = 1, limit = 10) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/my-novels?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取我参与创作的小说列表（排除自己的小说）
export const getParticipatedNovels = async (page = 1, limit = 10) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/participated-novels?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取小说详情
export const getNovelById = async (novelId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 更新小说
export const updateNovel = async (novelId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_BASE_URL}/${novelId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 删除小说
export const deleteNovel = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_BASE_URL}/${novelId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取热门小说
export const getPopularNovels = async (limit = 10) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/popular/list?limit=${limit}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};



// 更新小说设定（仅限特定字段）
export const updateNovelSettings = async (novelId, settingsData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_BASE_URL}/${novelId}/settings`, settingsData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取小说章节列表
export const getNovelChapters = async (novelId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取章节详情
export const getChapterById = async (novelId, chapterId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters/${chapterId}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 更新阅读进度
export const updateReadingProgress = async (novelId, chapterId, progressPercentage = 0, readingPathId = null) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/reading/progress`, {
            chapterId,
            progressPercentage,
            readingPathId
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取阅读进度
export const getReadingProgress = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 添加阅读历史（只记录读过）
export const addReadingHistory = async (novelId, chapterId, readingDuration = 0) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/reading/history`, {
            chapterId,
            readingDuration
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 书签：获取某本小说下的书签
export const getBookmarksByNovel = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/${novelId}/bookmarks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 书签：添加/更新
export const addBookmark = async (chapterId, note = null, isGlobal = false) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/bookmarks`, { chapterId, note, isGlobal }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 书签：移除
export const removeBookmark = async (chapterId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_BASE_URL}/bookmarks/${chapterId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 书签：是否存在
export const checkBookmarkExists = async (chapterId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/bookmarks/${chapterId}/exists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 全局书签列表
export const getGlobalBookmarks = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/bookmarks/global/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 其它书书签列表（排除当前小说）
export const getOtherBookmarks = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/${novelId}/bookmarks/others`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 创建章节
export const createChapter = async (novelId, chapterData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/chapters`, chapterData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取所有小说（用于首页展示）
export const getAllNovels = async (options = {}) => {
    try {
        const { limit = 10, sortBy = 'created_at', page = 1, tags } = options;
        let url = `${API_BASE_URL}/list?limit=${limit}&sortBy=${sortBy}&page=${page}`;

        // 添加标签筛选
        if (tags && tags.length > 0) {
            const tagsParam = tags.map(tag => encodeURIComponent(tag)).join(',');
            url += `&tags=${tagsParam}`;
        }

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取小说统计数据（用于首页统计）
export const getNovelStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取单个小说统计数据
export const getNovelStatsById = async (novelId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/stats`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 搜索小说
export const searchNovels = async (query, options = {}) => {
    try {
        const { limit = 50, page = 1 } = options;
        const response = await axios.get(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// =======================
// 阅读线相关接口
// =======================

// 获取小说的阅读线列表
export const getReadingPaths = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading-paths`, {
            headers
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取阅读线详情
export const getReadingPathDetail = async (novelId, pathId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading-paths/${pathId}`, {
            headers
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 创建阅读线
export const createReadingPath = async (novelId, pathData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/reading-paths`, pathData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 更新阅读线
export const updateReadingPath = async (novelId, pathId, pathData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_BASE_URL}/${novelId}/reading-paths/${pathId}`, pathData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 删除阅读线
export const deleteReadingPath = async (novelId, pathId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_BASE_URL}/${novelId}/reading-paths/${pathId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取用户的自定义阅读线
export const getUserCustomPath = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading-paths/custom/mine`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取作者推荐阅读线
export const getAuthorRecommendedPath = async (novelId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading-paths/author-recommended`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 随机漫步 - 获取下一章节
export const getRandomNextChapter = async (novelId, currentChapterId = null) => {
    try {
        const params = currentChapterId ? { currentChapterId } : {};
        const response = await axios.get(`${API_BASE_URL}/${novelId}/reading-paths/random/next`, {
            params
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取章节树结构（用于阅读线创建）
export const getChapterTree = async (novelId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters/tree`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// ========================
// 收藏相关API
// ========================

// 收藏/取消收藏小说
export const toggleNovelFavorite = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/favorite`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 检查小说收藏状态
export const checkNovelFavoriteStatus = async (novelId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return { success: true, isFavorited: false };
        
        const response = await axios.get(`${API_BASE_URL}/${novelId}/favorite/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取用户收藏的小说列表
export const getUserFavoriteNovels = async (page = 1, limit = 20) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/favorites/mine?page=${page}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// ========================
// 点赞相关API
// ========================

// 点赞/取消点赞章节
export const toggleChapterLike = async (novelId, chapterId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/like`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 检查章节点赞状态
export const checkChapterLikeStatus = async (novelId, chapterId) => {
    try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
        
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/like/status`, config);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取章节点赞数量
export const getChapterLikeCount = async (novelId, chapterId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/likes/count`);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 点赞/取消点赞评论
export const toggleCommentLike = async (commentId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/comments/${commentId}/like`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// ========================
// 评论相关API
// ========================

// 获取章节评论列表
export const getChapterComments = async (novelId, chapterId, page = 1, limit = 20) => {
    try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
        
        const response = await axios.get(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/comments?page=${page}&limit=${limit}`, config);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 创建章节评论
export const createChapterComment = async (novelId, chapterId, content, parentCommentId = null) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/comments`, {
            content,
            parentCommentId
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取评论回复列表
export const getCommentReplies = async (commentId, page = 1, limit = 10) => {
    try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
        
        const response = await axios.get(`${API_BASE_URL}/comments/${commentId}/replies?page=${page}&limit=${limit}`, config);
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 删除评论
export const deleteComment = async (commentId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// ========================
// 举报相关API
// ========================

// 举报章节
export const reportChapter = async (novelId, chapterId, reason, description = '') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/${novelId}/chapters/${chapterId}/report`, {
            reason,
            description
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 举报评论
export const reportComment = async (commentId, reason, description = '') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/comments/${commentId}/report`, {
            reason,
            description
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};

// 获取用户的举报记录
export const getUserReports = async (page = 1, limit = 20) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/reports/mine?page=${page}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return error.response.data;
        }
        return { success: false, message: '网络错误' };
    }
};
