const TOKEN_KEY = 'hive-memory-token';

/** Get the stored Bearer token. */
export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || 'test';
}

/** Set the Bearer token. */
export function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

async function request(path, init = {}) {
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(init.headers || {}),
    };

    const res = await fetch(`/api${path}`, { ...init, headers });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
    }

    if (res.status === 204) return null;

    return res.json();
}

export const api = {
    health: () => request('/health'),
    searchLearnings: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.tags) qs.set('tags', params.tags);
        if (params.engineer) qs.set('engineer', params.engineer);
        if (params.since) qs.set('since', params.since);
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));

        return request(`/learnings?${qs}`);
    },
    getLearning: (id) => request(`/learnings/${id}`),
    updateLearning: (id, body) => request(`/learnings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteLearning: (id) => request(`/learnings/${id}`, { method: 'DELETE' }),
    getSessions: (limit = 25) => request(`/sessions?limit=${limit}`),
    getGraph: (limit = 500) => request(`/graph?limit=${limit}`),
    getRelated: (params) => {
        const qs = new URLSearchParams();
        if (params.learningId) qs.set('learningId', params.learningId);
        if (params.symbol) qs.set('symbol', params.symbol);
        if (params.depth) qs.set('depth', String(params.depth));

        return request(`/related?${qs}`);
    },
};
