// Static Mock API Engine for GTST+ Student Portal
// Directly intercepts all GET, POST, and Upload calls and routes them to our in-memory/localStorage mock store.
import { handleMockApiRequest } from '../../mock/mockExamBackend';

export const API_BASE_URL = '';

async function apiRequest(method, path, { body, token, isFormData } = {}) {
  try {
    return await handleMockApiRequest(method, path, { body, token, isFormData });
  } catch (error) {
    if (!error.status) error.status = 500;
    throw error;
  }
}

export function apiGet(path, token) {
  return apiRequest('GET', path, { token });
}

export function apiPost(path, body, token) {
  return apiRequest('POST', path, { body, token });
}

export function apiUpload(path, formData, token) {
  return apiRequest('POST', path, { body: formData, token, isFormData: true });
}
