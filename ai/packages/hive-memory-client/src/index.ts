import type {
    HealthStatus,
    ImpactResult,
    LearningDetail,
    LearningResult,
    LearningSearchResult,
    RelatedResult,
    SaveSessionInput,
    SessionDetail,
    SessionResult,
    StoreSessionLearningInput,
} from '@ai/shared-types';

export interface MemoryClientConfig {
    baseUrl: string;
    token?: string;
}

export class MemoryClientError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: string,
    ) {
        super(`Trezor Hive Memory responded with ${status}: ${body}`);
        this.name = 'MemoryClientError';
    }
}

export class MemoryClient {
    private baseUrl: string;
    private token: string | undefined;

    constructor(config: MemoryClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.token = config.token;
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((init.headers as Record<string, string>) ?? {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

        if (!res.ok) {
            const body = await res.text();
            throw new MemoryClientError(res.status, body);
        }

        return res.json() as Promise<T>;
    }

    health(): Promise<HealthStatus> {
        return this.request('/api/health');
    }

    impact(symbol: string, depth?: number): Promise<ImpactResult> {
        const params = new URLSearchParams({ symbol });
        if (depth !== undefined) params.set('depth', String(depth));

        return this.request(`/api/impact?${params.toString()}`);
    }

    learn(
        input: Omit<StoreSessionLearningInput, 'relatedSymbols'> & { relatedSymbols?: string[] },
    ): Promise<LearningResult & { graphId: string }> {
        return this.request('/api/learn', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }

    searchLearnings(params: {
        q?: string;
        tags?: string[];
        engineer?: string;
        since?: string;
        limit?: number;
        offset?: number;
    }): Promise<LearningSearchResult> {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.tags?.length) qs.set('tags', params.tags.join(','));
        if (params.engineer) qs.set('engineer', params.engineer);
        if (params.since) qs.set('since', params.since);
        if (params.limit !== undefined) qs.set('limit', String(params.limit));
        if (params.offset !== undefined) qs.set('offset', String(params.offset));

        return this.request(`/api/learnings?${qs.toString()}`);
    }

    getLearning(id: string): Promise<LearningDetail> {
        return this.request(`/api/learnings/${id}`);
    }

    saveSession(input: SaveSessionInput): Promise<SessionResult> {
        return this.request('/api/sessions', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }

    getRecentSessions(limit?: number): Promise<SessionDetail[]> {
        const qs = limit !== undefined ? `?limit=${limit}` : '';

        return this.request(`/api/sessions${qs}`);
    }

    related(params: {
        learningId?: string;
        symbol?: string;
        depth?: number;
    }): Promise<RelatedResult> {
        const qs = new URLSearchParams();
        if (params.learningId) qs.set('learningId', params.learningId);
        if (params.symbol) qs.set('symbol', params.symbol);
        if (params.depth !== undefined) qs.set('depth', String(params.depth));

        return this.request(`/api/related?${qs.toString()}`);
    }
}
