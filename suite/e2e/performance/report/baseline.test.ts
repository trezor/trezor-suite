import { fetchBaseline } from './baseline';
import { LhciClient, type LhciProject } from './lhciClient';

const project: LhciProject = {
    id: 'p1',
    name: 'trezor-suite',
    slug: 'trezor-suite',
    baseBranch: 'develop',
};

const sealedBuild = {
    id: 'base-build',
    projectId: 'p1',
    branch: 'develop',
    hash: 'a'.repeat(40),
    lifecycle: 'sealed' as const,
    runAt: '2026-08-26T00:00:00.000Z',
};

const run = (url: string, audits: Record<string, number>) => ({
    id: 'r',
    url,
    lhr: JSON.stringify({
        audits: Object.fromEntries(
            Object.entries(audits).map(([id, numericValue]) => [id, { id, numericValue }]),
        ),
    }),
});

const URL_A = 'https://perf.suite.internal/desktop/T3W1/account-switch';

describe('fetchBaseline', () => {
    it('reduces the sealed builds runs to per-URL medians', async () => {
        const client = {
            getLatestSealedBuild: jest.fn(() => Promise.resolve(sealedBuild)),
            getRuns: jest.fn(() =>
                Promise.resolve([
                    run(URL_A, { 'total-blocking-time': 100 }),
                    run(URL_A, { 'total-blocking-time': 300 }),
                    run(URL_A, { 'total-blocking-time': 200 }),
                ]),
            ),
        };

        const baseline = await fetchBaseline({
            client: client as unknown as LhciClient,
            project,
            baseBranch: 'develop',
        });

        expect(baseline?.build.id).toBe('base-build');
        expect(baseline?.medians.get(URL_A)?.get('total-blocking-time')).toBe(200);
    });

    it('skips a run whose stored LHR does not parse', async () => {
        const client = {
            getLatestSealedBuild: jest.fn(() => Promise.resolve(sealedBuild)),
            getRuns: jest.fn(() =>
                Promise.resolve([
                    { id: 'r', url: URL_A, lhr: 'not json' },
                    run(URL_A, { 'total-blocking-time': 150 }),
                ]),
            ),
        };

        const baseline = await fetchBaseline({
            client: client as unknown as LhciClient,
            project,
            baseBranch: 'develop',
        });

        expect(baseline?.medians.get(URL_A)?.get('total-blocking-time')).toBe(150);
    });

    it('yields null when the branch has no sealed build', async () => {
        const client = { getLatestSealedBuild: jest.fn(() => Promise.resolve(null)) };

        expect(
            await fetchBaseline({
                client: client as unknown as LhciClient,
                project,
                baseBranch: 'develop',
            }),
        ).toBeNull();
    });

    // Absolute-values mode is this function returning null — a dead server must land there too.
    it('yields null when the server errors', async () => {
        const client = {
            getLatestSealedBuild: jest.fn(() => Promise.reject(new Error('[lhci] GET → 503'))),
        };

        expect(
            await fetchBaseline({
                client: client as unknown as LhciClient,
                project,
                baseBranch: 'develop',
            }),
        ).toBeNull();
    });
});
