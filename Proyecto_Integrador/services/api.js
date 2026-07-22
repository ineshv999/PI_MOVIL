import { Platform } from 'react-native';
import { getStoredItem, removeStoredItem, setStoredItem } from './storage';

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || `http://${fallbackHost}:8001/api/v1`).replace(/\/$/, '');

let refreshPromise = null;
let authFailureHandler = null;

export function configureAuthFailure(handler) {
  authFailureHandler = handler;
}

export function apiErrorMessage(error) {
  if (typeof error?.detail === 'string') return error.detail;
  if (Array.isArray(error?.detail)) return error.detail.map((item) => item.msg).join('\n');
  if (error?.message === 'Network request failed' || error instanceof TypeError) {
    return `No fue posible conectar con ${API_BASE_URL}. Verifica que Docker este activo y que el dispositivo pueda acceder a esa direccion.`;
  }
  return error?.message || 'Ocurrio un error inesperado.';
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const error = typeof data === 'object' ? data : { detail: data || `HTTP ${response.status}` };
    error.status = response.status;
    throw error;
  }
  return data;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await getStoredItem('refresh_token');
    if (!refreshToken) throw new Error('Sesion no disponible');
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const tokens = await parseResponse(response);
    await Promise.all([
      setStoredItem('access_token', tokens.access_token),
      setStoredItem('refresh_token', tokens.refresh_token),
    ]);
    return tokens.access_token;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function api(path, options = {}, retry = true) {
  const token = await getStoredItem('access_token');
  const headers = { Accept: 'application/json', ...options.headers };
  if (!(options.body instanceof FormData) && options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options, headers,
      body: options.body instanceof FormData || typeof options.body === 'string' ? options.body
        : options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 401 && retry && !path.startsWith('/auth/')) {
      const freshToken = await refreshAccessToken();
      return api(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${freshToken}` } }, false);
    }
    return await parseResponse(response);
  } catch (error) {
    if (error?.status === 401 && retry) {
      await Promise.all([removeStoredItem('access_token'), removeStoredItem('refresh_token'), removeStoredItem('user')]);
      authFailureHandler?.();
    }
    throw error;
  }
}

export async function downloadWithAuth(path) {
  const token = await getStoredItem('access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw await response.json();
  return response.blob();
}

export const endpoints = {
  login: (username, password) => api('/auth/login', { method: 'POST', body: { username, password } }, false),
  me: () => api('/auth/me'),
  users: () => api('/usuarios'),
  createUser: (data, role) => api(`/usuarios?rol=${role}`, { method: 'POST', body: data }),
  uploadUserPhoto: (id, form) => api(`/usuarios/${id}/foto`, { method: 'POST', body: form }),
  setUserActive: (id, active) => api(`/usuarios/${id}/activo?activo=${active}`, { method: 'PATCH' }),
  buildings: () => api('/catalogos/edificios'),
  createBuilding: (data) => api('/catalogos/edificios', { method: 'POST', body: data }),
  statuses: () => api('/catalogos/estatus'),
  assets: (search = '') => api(`/activos${search ? `?buscar=${encodeURIComponent(search)}` : ''}`),
  assetByQr: (code) => api(`/activos/qr/${encodeURIComponent(code)}`),
  createAsset: (data) => api('/activos', { method: 'POST', body: data }),
  uploadAssetPhoto: (id, form) => api(`/activos/${id}/foto`, { method: 'POST', body: form }),
  updateAsset: (id, data) => api(`/activos/${id}`, { method: 'PATCH', body: data }),
  audits: (search = '') => api(`/auditorias${search ? `?buscar=${encodeURIComponent(search)}` : ''}`),
  audit: (id) => api(`/auditorias/${id}`),
  createAudit: (data) => api('/auditorias', { method: 'POST', body: data }),
  updateAudit: (id, data) => api(`/auditorias/${id}`, { method: 'PATCH', body: data }),
  deleteAudit: (id) => api(`/auditorias/${id}`, { method: 'DELETE' }),
  startAudit: (id) => api(`/auditorias/${id}/iniciar`, { method: 'POST' }),
  completeAudit: (id) => api(`/auditorias/${id}/completar`, { method: 'POST' }),
  cancelAudit: (id, reason) => api(`/auditorias/${id}/cancelar`, { method: 'POST', body: { motivo: reason } }),
  assignAssets: (id, assetIds) => api(`/auditorias/${id}/activos`, { method: 'POST', body: { activo_ids: assetIds } }),
  reviewByQr: (auditId, code, data) => api(`/auditorias/${auditId}/qr/${encodeURIComponent(code)}/revision`, { method: 'PUT', body: data }),
  reviewAsset: (auditId, assetId, data) => api(`/auditorias/${auditId}/activos/${assetId}/revision`, { method: 'PUT', body: data }),
  uploadEvidence: (auditId, assetId, form) => api(`/auditorias/${auditId}/activos/${assetId}/evidencias`, { method: 'POST', body: form }),
};
