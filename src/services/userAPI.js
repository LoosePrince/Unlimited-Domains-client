import api from './authAPI';

export const userAPI = {
  // 获取用户公开信息
  getUserInfo: async (userId) => {
    return await api.get(`/users/${userId}`);
  },

  // 获取用户详细资料（包含私有信息）
  getUserProfile: async (userId) => {
    return await api.get(`/users/${userId}/profile`);
  },

  // 获取用户发布的小说
  getUserNovels: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/novels?page=${page}&limit=${limit}`);
  },

  // 获取用户发布的社区文章
  getUserArticles: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/articles?page=${page}&limit=${limit}`);
  },

  // 获取用户收藏列表（仅本人可见）
  getUserFavorites: async (userId, page = 1, limit = 10, type = 'all') => {
    return await api.get(`/users/${userId}/favorites?page=${page}&limit=${limit}&type=${type}`);
  },

  // 获取用户书签列表（仅本人可见）
  getUserBookmarks: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/bookmarks?page=${page}&limit=${limit}`);
  },

  // 获取用户阅读历史（仅本人可见）
  getUserReadingHistory: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/reading-history?page=${page}&limit=${limit}`);
  },

  // 获取用户自定义阅读线（仅本人可见）
  getUserReadingPaths: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/reading-paths?page=${page}&limit=${limit}`);
  },

  // 获取用户评论列表（仅本人可见）
  getUserComments: async (userId, page = 1, limit = 10) => {
    return await api.get(`/users/${userId}/comments?page=${page}&limit=${limit}`);
  }
};

export default userAPI;
