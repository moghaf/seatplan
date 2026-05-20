let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(url, { headers, ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<import('./types').LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (d: { username: string; password: string; displayName: string; role?: string }) =>
      request<import('./types').UserInfo>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(d),
      }),
    list: () => request<import('./types').UserInfo[]>('/api/auth/users'),
    setPassword: (id: number, password: string) =>
      request(`/api/auth/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }),
    setTeamMember: (id: number, teamMemberId: number | null) =>
      request<import('./types').UserInfo>(`/api/auth/users/${id}/team-member`, {
        method: 'PUT',
        body: JSON.stringify({ teamMemberId }),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('/api/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
  functions: {
    list: () => request<import('./types').WorkFunction[]>('/api/functions'),
    create: (d: { name: string; description?: string }) =>
      request<import('./types').WorkFunction>('/api/functions', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: { name: string; description?: string }) =>
      request(`/api/functions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: number) => request(`/api/functions/${id}`, { method: 'DELETE' }),
  },
  teams: {
    list: (functionId?: number) =>
      request<import('./types').Team[]>(`/api/teams${functionId ? `?functionId=${functionId}` : ''}`),
    create: (d: { name: string; color: string; functionId: number }) =>
      request<import('./types').Team>('/api/teams', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<import('./types').Team>) =>
      request(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: number) => request(`/api/teams/${id}`, { method: 'DELETE' }),
  },
  members: {
    list: (functionId?: number) =>
      request<import('./types').TeamMember[]>(`/api/members${functionId ? `?functionId=${functionId}` : ''}`),
    create: (d: Partial<import('./types').TeamMember>) =>
      request<import('./types').TeamMember>('/api/members', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<import('./types').TeamMember>) =>
      request(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: number) => request(`/api/members/${id}`, { method: 'DELETE' }),
  },
  seats: {
    list: (functionId?: number) =>
      request<import('./types').Seat[]>(`/api/seats${functionId ? `?functionId=${functionId}` : ''}`),
    listWithAssignments: (functionId?: number) =>
      request<import('./types').SeatWithAssignments[]>(
        `/api/seats/with-assignments${functionId ? `?functionId=${functionId}` : ''}`
      ),
    create: (name: string, functionId: number, positionX?: number, positionY?: number) =>
      request<import('./types').Seat>('/api/seats', { method: 'POST', body: JSON.stringify({ name, functionId, positionX, positionY }) }),
    update: (id: number, name: string, functionId?: number) =>
      request(`/api/seats/${id}`, { method: 'PUT', body: JSON.stringify({ name, functionId }) }),
    updatePosition: (id: number, positionX: number, positionY: number) =>
      request(`/api/seats/${id}/position`, { method: 'POST', body: JSON.stringify({ positionX, positionY }) }),
    delete: (id: number) => request(`/api/seats/${id}`, { method: 'DELETE' }),
    toggleUnavailable: (seatId: number, date: string) =>
      request(`/api/seats/${seatId}/toggle-unavailable`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),
  },
  weeks: {
    list: () => request<{ weeks: import('./types').WeekInfo[] }>('/api/weeks'),
  },
  assignments: {
    create: (d: { seatId: number; date: string; teamMemberId: number }) =>
      request<import('./types').AssignmentInfo>('/api/assignments', { method: 'POST', body: JSON.stringify(d) }),
    delete: (id: number) => request(`/api/assignments/${id}`, { method: 'DELETE' }),
  },
  holidays: {
    list: () => request<import('./types').Holiday[]>('/api/holidays'),
    create: (d: { name: string; month: number; day: number }) =>
      request<import('./types').Holiday>('/api/holidays', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: { name: string; month: number; day: number }) =>
      request(`/api/holidays/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: number) => request(`/api/holidays/${id}`, { method: 'DELETE' }),
  },
};
