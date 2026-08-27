const API_BASE = '/api';

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
  list: () => projectRequest('/admin/all'),
  create: (formData) => projectRequest('', { method: 'POST', body: formData }),
  update: (id, formData) => projectRequest(`/${id}`, { method: 'PUT', body: formData }),
  updateStatus: (id, data) => projectRequest(`/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  remove: (id) => projectRequest(`/${id}`, { method: 'DELETE' }),
};
