import { baselineUrl, fetchBaselineDocument, mergeBaselines } from './baseline';
import type { Baselines } from './types';

const document = {
    updatedAt: '2026-09-18T00:12:00.000Z',
    branch: 'develop',
    sha: 'abc1234',
    run: '1840',
    screens: { home: { ttffMs: 380, ttiMs: 900 } },
};

const respondWith = (status: number, body: string) => () =>
    Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(body),
    });

describe('baselineUrl', () => {
    it('points at the public object, which needs no credentials', () => {
        expect(baselineUrl('develop')).toBe(
            'https://dev.suite.sldev.cz/e2e/perf/native/v1/baseline/develop/latest.json',
        );
    });
});

describe('fetchBaselineDocument', () => {
    it('loads a sealed baseline', async () => {
        const outcome = await fetchBaselineDocument(
            'develop',
            respondWith(200, JSON.stringify(document)),
        );

        expect(outcome).toMatchObject({ status: 'loaded', document });
    });

    it('treats a missing object as "no baseline yet", not as an error', async () => {
        await expect(fetchBaselineDocument('develop', respondWith(404, ''))).resolves.toMatchObject(
            {
                status: 'absent',
            },
        );
    });

    it('reports a server error without throwing', async () => {
        await expect(fetchBaselineDocument('develop', respondWith(500, ''))).resolves.toMatchObject(
            {
                status: 'unavailable',
                reason: 'HTTP 500',
            },
        );
    });

    it('reports malformed json without throwing', async () => {
        await expect(
            fetchBaselineDocument('develop', respondWith(200, 'not json')),
        ).resolves.toMatchObject({ status: 'unavailable' });
    });

    it('reports a rejected request without throwing', async () => {
        await expect(
            fetchBaselineDocument('develop', () => Promise.reject(new Error('timed out'))),
        ).resolves.toMatchObject({ status: 'unavailable', reason: 'timed out' });
    });
});

describe('mergeBaselines', () => {
    const committed: Baselines = {
        home: { ttffMs: 500, ttiMs: 1100, fidMs: 40 },
        send: { ttffMs: 600 },
    };

    it('keeps the committed numbers when nothing is served', () => {
        expect(mergeBaselines(committed, null)).toEqual(committed);
    });

    it('lets the served numbers win per metric and keeps the rest', () => {
        expect(mergeBaselines(committed, { home: { ttffMs: 380 } })).toEqual({
            home: { ttffMs: 380, ttiMs: 1100, fidMs: 40 },
            send: { ttffMs: 600 },
        });
    });

    it('adds a screen that only the served baseline knows', () => {
        expect(mergeBaselines(committed, { receive: { ttffMs: 300 } })).toMatchObject({
            receive: { ttffMs: 300 },
        });
    });
});
