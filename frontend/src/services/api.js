const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data;
}

export async function fetchRequisitions() {
  const res = await fetch(`${BASE_URL}/requisitions`);
  return handleResponse(res);
}

export async function fetchApplications() {
  const res = await fetch(`${BASE_URL}/applications`);
  return handleResponse(res);
}

export async function fetchSummary() {
  const res = await fetch(`${BASE_URL}/summary`);
  return handleResponse(res);
}

export async function fetchActiveRecruiters() {
  const res = await fetch(`${BASE_URL}/recruiters`);
  return handleResponse(res);
}

export async function fetchCalls() {
  const res = await fetch(`${BASE_URL}/calls`);
  return handleResponse(res);
}
