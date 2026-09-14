import { LhciClient, compareLink } from './lhciClient';

/**
 * The fetch stub replays responses recorded against a real @lhci/server 0.15.1 during the Phase 0
 * spike (statuses, bodies, the E422 wording) — the sandbox cannot open sockets, so this is the
 * faithful stand-in for the live round-trip.
 */

type Route = { status: number; body: unknown };

const stubFetch = (routes: Record<string, Route>) => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    globalThis.fetch = jest.fn((url: unknown, init?: unknown) => {
        const request = { url: String(url), init: (init ?? {}) as RequestInit };
        calls.push(request);
        const route = routes[`${request.init.method} ${request.url}`];
        if (!route) {
            return Promise.reject(new Error(`no route for ${request.init.method} ${request.url}`));
        }

        return Promise.resolve({
            status: route.status,
            text: () => Promise.resolve(JSON.stringify(route.body)),
        });
    }) as unknown as typeof fetch;

    return calls;
};

const SERVER = 'http://lhci.test';

const build = (overrides: Record<string, unknown> = {}) => ({
    id: 'b1',
    projectId: 'p1',
    branch: 'develop',
    hash: 'a'.repeat(40),
    lifecycle: 'sealed',
    runAt: '2026-08-26T00:00:00.000Z',
    ...overrides,
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('LhciClient', () => {
    it('finds the project by name, with a lone project as the fallback', async () => {
        stubFetch({
            [`GET ${SERVER}/v1/projects`]: {
                status: 200,
                body: [
                    { id: 'p1', name: 'other', slug: 'other', baseBranch: 'develop' },
                    { id: 'p2', name: 'trezor-suite', slug: 'trezor-suite', baseBranch: 'develop' },
                ],
            },
        });
        const client = new LhciClient(SERVER);

        expect((await client.findProject('trezor-suite'))?.id).toBe('p2');
        expect(await client.findProject('nonexistent')).toBeNull();
    });

    it('sends the build token on writes', async () => {
        const calls = stubFetch({
            [`POST ${SERVER}/v1/projects/p1/builds`]: { status: 200, body: build() },
        });
        const client = new LhciClient(SERVER, 'secret-token');

        await client.createBuild('p1', {
            branch: 'develop',
            hash: 'a'.repeat(40),
            ancestorHash: 'a'.repeat(40),
            commitMessage: 'm',
            author: 'a',
            avatarUrl: '',
            externalBuildUrl: '',
            runAt: '',
            committedAt: '',
        });

        expect((calls[0]?.init.headers as Record<string, string>)['x-lhci-build-token']).toBe(
            'secret-token',
        );
    });

    // Recorded verbatim: 422 {"message":"Build already exists for hash \"…\""} on a re-run.
    it('turns the duplicate-build 422 into null instead of throwing', async () => {
        stubFetch({
            [`POST ${SERVER}/v1/projects/p1/builds`]: {
                status: 422,
                body: { message: 'Build already exists for hash "aaa…"' },
            },
        });
        const client = new LhciClient(SERVER, 't');

        expect(
            await client.createBuild('p1', {
                branch: 'develop',
                hash: 'a'.repeat(40),
                ancestorHash: 'a'.repeat(40),
                commitMessage: 'm',
                author: 'a',
                avatarUrl: '',
                externalBuildUrl: '',
                runAt: '',
                committedAt: '',
            }),
        ).toBeNull();
    });

    it('skips unsealed builds when looking for the latest sealed one', async () => {
        stubFetch({
            [`GET ${SERVER}/v1/projects/p1/builds?branch=develop&limit=10`]: {
                status: 200,
                body: [build({ id: 'unsealed', lifecycle: 'unsealed' }), build({ id: 'older' })],
            },
        });
        const client = new LhciClient(SERVER);

        expect((await client.getLatestSealedBuild('p1', 'develop'))?.id).toBe('older');
    });

    it('seals with the bare "sealed" body the server expects', async () => {
        const calls = stubFetch({
            [`PUT ${SERVER}/v1/projects/p1/builds/b1/lifecycle`]: { status: 204, body: '' },
        });
        const client = new LhciClient(SERVER, 't');

        await client.sealBuild('p1', 'b1');

        expect(calls[0]?.init.body).toBe(JSON.stringify('sealed'));
    });

    it('throws a readable error on other failures', async () => {
        stubFetch({ [`GET ${SERVER}/v1/projects`]: { status: 500, body: 'boom' } });
        const client = new LhciClient(SERVER);

        await expect(client.findProject('x')).rejects.toThrow('GET /v1/projects → 500');
    });
});

describe('compareLink', () => {
    it('builds the deep link the server UI understands', () => {
        expect(
            compareLink({
                serverUrl: SERVER,
                slug: 'trezor-suite',
                buildId: 'cur',
                baseBuildId: 'base',
                compareUrl: 'https://perf.suite.internal/web/T3W1/a',
            }),
        ).toBe(
            `${SERVER}/app/projects/trezor-suite/compare/cur?baseBuild=base&compareUrl=${encodeURIComponent('https://perf.suite.internal/web/T3W1/a')}`,
        );
    });
});
