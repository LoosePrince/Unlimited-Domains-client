import api from './authAPI';

export const uploadAPI = {
  // 上传头像
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除头像（恢复默认）
  deleteAvatar: async () => {
    return await api.delete('/upload/avatar');
  },

  // 获取上传配置
  getUploadConfig: async () => {
    return await api.get('/upload/config');
  },
};

export default uploadAPI;
