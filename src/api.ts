import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Media
export const importMedia = (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  return api.post('/media/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMedia = () => api.get('/media');
export const getMediaById = (id: number) => api.get(`/media/${id}`);
export const getMediaUsage = (id: number) => api.get(`/media/${id}/usage`);
export const deleteMedia = (id: number) => api.delete(`/media/${id}`);

// Batches
export const createBatch = (data: any) => api.post('/batches', data);
export const getBatches = () => api.get('/batches');
export const getBatchById = (id: number) => api.get(`/batches/${id}`);
export const updateBatch = (id: number, data: any) => api.patch(`/batches/${id}`, data);
export const deleteBatch = (id: number) => api.delete(`/batches/${id}`);
export const addMediaToBatch = (batchId: number, mediaIds: number[]) =>
  api.post(`/batches/${batchId}/media`, { mediaIds });
export const removeMediaFromBatch = (batchId: number, mediaId: number) =>
  api.delete(`/batches/${batchId}/media/${mediaId}`);
export const getBatchUsage = (id: number) => api.get(`/batches/${id}/usage`);

// Posts
export const createPost = (data: any) => api.post('/posts', data);
export const getPosts = (params?: any) => api.get('/posts', { params });
export const getPostById = (id: number) => api.get(`/posts/${id}`);
export const updatePost = (id: number, data: any) => api.patch(`/posts/${id}`, data);
export const deletePost = (id: number) => api.delete(`/posts/${id}`);

// Conflicts
export const checkConflicts = (data: any) => api.post('/conflicts/check', data);

// Config
export const getConfig = () => api.get('/config');
export const updateConfig = (key: string, value: string) =>
  api.patch(`/config/${key}`, { value });

// Accounts & Platforms
export const getAccounts = () => api.get('/accounts');
export const getPlatforms = () => api.get('/platforms');

// Export
export const exportData = () => api.get('/export');

export default api;
