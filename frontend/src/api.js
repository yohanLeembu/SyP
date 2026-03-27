const BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 
      'Content-Type': 'application/json', 
      ...extraHeaders       // merge extra headers on top, not replace
    },
    ...restOptions,         // spread everything else (method, body, etc.)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getMe: (token) =>
    request('/users/me', { headers: { Authorization: `Bearer ${token}` } }),

  getAllUsers: (token) =>
    request('/users/all', { headers: { Authorization: `Bearer ${token}` } }),

  deleteUser: (id, token) =>
    request(`/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

    // --- Vacancies ---

// Get all active vacancies (public)
getVacancies: () =>
  request('/vacancies'),

// Admin: create a new vacancy
createVacancy: (body, token) =>
  request('/vacancies', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',   // ← this is what was missing
    },
    body: JSON.stringify(body),
  }),

// Admin: delete a vacancy
deleteVacancy: (id, token) =>
  request(`/vacancies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),

// Barber: update a vacancy
updateVacancy: (id, body, token) =>
  request(`/vacancies/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }),

// Admin: get all applications
getApplications: (token) =>
  request('/vacancies/applications', { headers: { Authorization: `Bearer ${token}` } }),

// Public: apply for a vacancy — NOTE: uses FormData (not JSON) because of file upload
applyForVacancy: (vacancyId, formData) =>
  fetch(`http://localhost:5000/api/vacancies/${vacancyId}/apply`, {
    method: 'POST',
    body: formData,  // FormData handles the CV file + text fields together
    // Do NOT set Content-Type header — browser sets it automatically with the file boundary
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to apply.');
    return data;
  }),
  // Admin: accept or reject an application
updateApplicationStatus: (applicationId, status, token) =>
  request(`/vacancies/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  }),
// Admin: add a new barber (multipart — includes image file)
createBarber: (formData, token) =>
  fetch('http://localhost:5000/api/barbers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,   // FormData handles image + text fields
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create barber.');
    return data;
  }),

// Admin: edit a barber
updateBarber: (id, formData, token) =>
  fetch(`http://localhost:5000/api/barbers/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update barber.');
    return data;
  }),

// Admin: deactivate a barber
deleteBarber: (id, token) =>
  request(`/barbers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),

// Get all barbers (public)
getBarbers: () =>
  request('/barbers'),

// Get single barber by ID (public)
getBarber: (id) =>
  request(`/barbers/${id}`),
};
