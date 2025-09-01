import axios from 'axios';
import config from '../config/env';

const API_BASE_URL = config.API_BASE_URL + '/api/community';

export const getCommunityHome = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/home`);
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const createArticle = async ({ title, content, tags = [] }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/articles`, { title, content, tags }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const getArticleDetail = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await axios.get(`${API_BASE_URL}/articles/${id}`, { headers });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const getArticleComments = async (id, page = 1, limit = 20) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await axios.get(`${API_BASE_URL}/articles/${id}/comments?page=${page}&limit=${limit}`, { headers });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const postArticleComment = async (id, content, parentCommentId = null) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/articles/${id}/comments`, { content, parentCommentId }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const toggleArticleLike = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/articles/${id}/like`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const toggleArticleFavorite = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/articles/${id}/favorite`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const shareArticle = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/articles/${id}/share`);
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const reportArticle = async (id, reason = 'other', description = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/articles/${id}/report`, { reason, description }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const likeComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/comments/${commentId}/like`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};

export const reportComment = async (commentId, reason = 'other', description = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/comments/${commentId}/report`, { reason, description }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) return error.response.data;
    return { success: false, message: '网络错误' };
  }
};


