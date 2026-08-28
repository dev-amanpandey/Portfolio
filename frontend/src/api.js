const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiAssetUrl = (fileUrl) => {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl) || !API_BASE.startsWith('http')) return fileUrl;
  return `${new URL(API_BASE).origin}${fileUrl}`;
};

export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  me: async () => {
    const response = await fetch(`${API_BASE}/admin/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return response;
  },
};

const certificateRequest = async (path = '', options = {}) => {
  const response = await fetch(`${API_BASE}/certificates${path}`, {
    credentials: 'include',
    ...options,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Unable to complete the certificate request.');
  return result;
};

export const certificateAPI = {
  list: () => certificateRequest(),
  create: (formData) => certificateRequest('', { method: 'POST', body: formData }),
  update: (id, formData) => certificateRequest(`/${id}`, { method: 'PUT', body: formData }),
  remove: (id) => certificateRequest(`/${id}`, { method: 'DELETE' }),
};

const projectRequest = async (path = '', options = {}) => {
  const response = await fetch(`${API_BASE}/projects${path}`, { credentials: 'include', ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Unable to complete the project request.');
  return result;
};

export const projectAPI = {
  publicList: () => projectRequest(),
  list: () => projectRequest('/admin/all'),
  create: (formData) => projectRequest('', { method: 'POST', body: formData }),
  update: (id, formData) => projectRequest(`/${id}`, { method: 'PUT', body: formData }),
  updateStatus: (id, data) => projectRequest(`/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  remove: (id) => projectRequest(`/${id}`, { method: 'DELETE' }),
};

const resumeRequest = async (path = '', options = {}) => {
  const response = await fetch(`${API_BASE}/resume${path}`, { credentials: 'include', ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Unable to complete the resume request.');
  return result;
};

export const resumeAPI = {
  publicCurrent: () => resumeRequest(),
  downloadUrl: () => `${API_BASE}/resume/download`,
  current: () => resumeRequest('/admin/current'),
  upload: (formData) => resumeRequest('', { method: 'POST', body: formData }),
  remove: () => resumeRequest('', { method: 'DELETE' }),
};

export const contactAPI = {
  send: async (data) => {
    const response = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to send your message.');
    return result;
  },
};
