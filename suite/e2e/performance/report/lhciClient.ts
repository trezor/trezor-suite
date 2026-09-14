/**
 * The thin seam to the LHCI server: just the documented REST calls the pipeline needs, so moving
 * off LHCI one day means swapping this module, not the report logic.
 *
 * Server contract (source-verified against @lhci/server 0.15.1): writes need the project build
 * token in `x-lhci-build-token`, GETs are open; POST of a duplicate (branch, hash) build → 422;
 * POST of a run onto a sealed build → 422, so a sealed build is terminal for uploads.
 */

export type LhciProject = {
    id: string;
    name: string;
    slug: string;
    baseBranch: string;
};

export type LhciBuild = {
    id: string;
    projectId: string;
    branch: string;
    hash: string;
    lifecycle: 'unsealed' | 'sealed';
    runAt: string;
    commitMessage?: string;
};

export type LhciRun = {
    id: string;
    url: string;
    /** The LHR, JSON-stringified — that is how the server stores and returns it. */
    lhr: string;
};

export type NewBuild = {
    branch: string;
    hash: string;
    ancestorHash: string;
    commitMessage: string;
    author: string;
    avatarUrl: string;
    externalBuildUrl: string;
    runAt: string;
    committedAt: string;
};

export class LhciClient {
    constructor(
        private readonly serverUrl: string,
        private readonly buildToken?: string,
    ) {}

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<{ status: number; body: T }> {
        const response = await fetch(`${this.serverUrl.replace(/\/$/, '')}${path}`, {
            method,
            headers: {
                'content-type': 'application/json',
                ...(this.buildToken ? { 'x-lhci-build-token': this.buildToken } : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const text = await response.text();
        let parsed: unknown = text;
        try {
            parsed = JSON.parse(text);
        } catch {
            // Non-JSON bodies (204s, proxy error pages) stay as text.
        }

        return { status: response.status, body: parsed as T };
    }

    private async expectOk<T>(method: string, path: string, body?: unknown): Promise<T> {
        const response = await this.request<T>(method, path, body);
        if (response.status >= 300) {
            throw new Error(
                `[lhci] ${method} ${path} → ${response.status}: ${JSON.stringify(response.body).slice(0, 300)}`,
            );
        }

        return response.body;
    }

    /** The named project, or the only one the server has — a fresh server needs no config. */
    async findProject(name: string): Promise<LhciProject | null> {
        const projects = await this.expectOk<LhciProject[]>('GET', '/v1/projects');
        if (!Array.isArray(projects)) {
            return null;
        }

        const named = projects.find(project => project.name === name);
        if (named) {
            return named;
        }

        return projects.length === 1 ? (projects[0] ?? null) : null;
    }

    listBuilds(projectId: string, branch: string, limit = 10): Promise<LhciBuild[]> {
        const query = `?branch=${encodeURIComponent(branch)}&limit=${limit}`;

        return this.expectOk<LhciBuild[]>('GET', `/v1/projects/${projectId}/builds${query}`);
    }

    /** Newest first is the server's order; a run that died before sealing is scanned past. */
    async getLatestSealedBuild(projectId: string, branch: string): Promise<LhciBuild | null> {
        const builds = await this.listBuilds(projectId, branch);

        return builds.find(build => build.lifecycle === 'sealed') ?? null;
    }

    async findBuildByHash(
        projectId: string,
        branch: string,
        hash: string,
    ): Promise<LhciBuild | null> {
        const builds = await this.listBuilds(projectId, branch, 50);

        return builds.find(build => build.hash === hash) ?? null;
    }

    /** null on the duplicate-(branch, hash) 422 — the caller decides what reuse means. */
    async createBuild(projectId: string, build: NewBuild): Promise<LhciBuild | null> {
        const response = await this.request<LhciBuild>('POST', `/v1/projects/${projectId}/builds`, {
            projectId,
            lifecycle: 'unsealed',
            ...build,
        });
        if (response.status === 422) {
            return null;
        }
        if (response.status >= 300) {
            throw new Error(`[lhci] createBuild → ${response.status}`);
        }

        return response.body;
    }

    getRuns(projectId: string, buildId: string): Promise<LhciRun[]> {
        return this.expectOk<LhciRun[]>('GET', `/v1/projects/${projectId}/builds/${buildId}/runs`);
    }

    async postRun(projectId: string, buildId: string, url: string, lhr: string): Promise<void> {
        await this.expectOk('POST', `/v1/projects/${projectId}/builds/${buildId}/runs`, {
            projectId,
            buildId,
            representative: false,
            url,
            lhr,
        });
    }

    /** Sealing computes the server-side statistics and locks the build against further runs. */
    async sealBuild(projectId: string, buildId: string): Promise<void> {
        await this.expectOk(
            'PUT',
            `/v1/projects/${projectId}/builds/${buildId}/lifecycle`,
            'sealed',
        );
    }
}

/** Deep link into the server's compare view, as its UI builds it. */
export const compareLink = ({
    serverUrl,
    slug,
    buildId,
    baseBuildId,
    compareUrl,
}: {
    serverUrl: string;
    slug: string;
    buildId: string;
    baseBuildId: string;
    compareUrl?: string;
}) => {
    const base = `${serverUrl.replace(/\/$/, '')}/app/projects/${slug}/compare/${buildId}?baseBuild=${baseBuildId}`;

    return compareUrl ? `${base}&compareUrl=${encodeURIComponent(compareUrl)}` : base;
};
