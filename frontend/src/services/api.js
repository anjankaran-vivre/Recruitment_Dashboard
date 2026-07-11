const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT = 60000

async function fetchWithTimeout(url, ms = TIMEOUT) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data;
}

export async function fetchRequisitions() {
  const res = await fetchWithTimeout(`${BASE_URL}/requisitions`);
  return handleResponse(res);
}

export async function fetchApplications() {
  const res = await fetchWithTimeout(`${BASE_URL}/applications`);
  return handleResponse(res);
}

export async function fetchSummary() {
  const res = await fetchWithTimeout(`${BASE_URL}/summary`);
  return handleResponse(res);
}

export async function fetchActiveRecruiters() {
  const res = await fetchWithTimeout(`${BASE_URL}/recruiters`);
  return handleResponse(res);
}

export async function fetchCalls() {
  const res = await fetchWithTimeout(`${BASE_URL}/calls`);
  return handleResponse(res);
}
