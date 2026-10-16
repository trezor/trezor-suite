import type { PerfBaselineDocument } from './store';
import {
    baselineUrl,
    fetchBaselineDocument,
    fetchStoreText,
    mergeStoredBaseline,
} from './storeReader';

const document: PerfBaselineDocument = {
    updatedAt: '2026-09-18T00:12:00.000Z',
    surface: 'android',
    branch: 'develop',
    sha: 'abc1234',
    run: '1840',
    measurements: { home: { 'rn:ttffMs': 380, 'rn:ttiMs': 900 } },
};

const respondWith = (status: number, body: string) => () =>
    Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(body),
    });

describe('baselineUrl', () => {
    it('points at the public object, which needs no credentials', () => {
        expect(baselineUrl('web', 'develop')).toBe(
            'https://dev.suite.sldev.cz/e2e/perf/v1/baseline/web/develop/latest.json',
        );
    });
});

describe('fetchStoreText', () => {
    it('reads an object that is there', async () => {
        await expect(fetchStoreText('https://x/y', respondWith(200, 'a\nb'))).resolves.toEqual({
            status: 'ok',
            text: 'a\nb',
        });
    });

    it('treats a bucket 403 as absent, which is what a missing key returns', async () => {
        await expect(fetchStoreText('https://x/y', respondWith(403, ''))).resolves.toEqual({
            status: 'absent',
        });
    });
});

describe('fetchBaselineDocument', () => {
    it('loads a sealed baseline', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', respondWith(200, JSON.stringify(document))),
        ).resolves.toMatchObject({ status: 'loaded', document });
    });

    it('treats a missing object as "no baseline yet", not as an error', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', respondWith(404, '')),
        ).resolves.toMatchObject({ status: 'absent' });
    });

    it('reports a server error without throwing', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', respondWith(500, '')),
        ).resolves.toMatchObject({ status: 'unavailable', reason: 'HTTP 500' });
    });

    it('reports malformed json without throwing', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', respondWith(200, 'not json')),
        ).resolves.toMatchObject({ status: 'unavailable' });
    });

    it('reports a document of the wrong shape without throwing', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', respondWith(200, '{"nope":1}')),
        ).resolves.toMatchObject({ status: 'unavailable', reason: 'malformed baseline document' });
    });

    it('reports a rejected request without throwing', async () => {
        await expect(
            fetchBaselineDocument('android', 'develop', () =>
                Promise.reject(new Error('timed out')),
            ),
        ).resolves.toMatchObject({ status: 'unavailable', reason: 'timed out' });
    });
});

describe('mergeStoredBaseline', () => {
    const committed = {
        home: { 'rn:ttffMs': 500, 'rn:ttiMs': 1100, 'rn:fidMs': 40 },
        send: { 'rn:ttffMs': 600 },
    };

    it('keeps the committed numbers when nothing is served', () => {
        expect(mergeStoredBaseline(committed, null)).toEqual(committed);
    });

    it('lets the served numbers win per metric and keeps the rest', () => {
        expect(mergeStoredBaseline(committed, document)).toEqual({
            home: { 'rn:ttffMs': 380, 'rn:ttiMs': 900, 'rn:fidMs': 40 },
            send: { 'rn:ttffMs': 600 },
        });
    });

    it('adds a measurement only the served baseline knows', () => {
        expect(
            mergeStoredBaseline(committed, {
                ...document,
                measurements: { receive: { 'rn:ttffMs': 300 } },
            }),
        ).toMatchObject({ receive: { 'rn:ttffMs': 300 } });
    });
});
