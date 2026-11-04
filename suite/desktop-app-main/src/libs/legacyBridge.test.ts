import { isLegacyBridgeRunning } from './legacyBridge';

const mockFetchResponse = (response: { ok: boolean; json: () => Promise<unknown> }) =>
    jest.fn(() => Promise.resolve(response)) as unknown as typeof fetch;

describe('isLegacyBridgeRunning', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('returns true when legacy bridge responds with 2.x version', async () => {
        const fetchMock = mockFetchResponse({
            ok: true,
            json: () => Promise.resolve({ version: '2.0.30' }),
        });
        global.fetch = fetchMock;

        await expect(isLegacyBridgeRunning()).resolves.toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            'http://127.0.0.1:21325/',
            expect.objectContaining({
                method: 'POST',
                headers: { Origin: 'https://electron.trezor.io' },
            }),
        );
    });

    it('returns false when legacy bridge rejects the request', async () => {
        global.fetch = mockFetchResponse({ ok: false, json: () => Promise.reject() });

        await expect(isLegacyBridgeRunning()).resolves.toBe(false);
    });

    it.each([{}, { version: '3.2.1' }, { version: 2 }, null])(
        'returns false for response %p',
        async data => {
            global.fetch = mockFetchResponse({ ok: true, json: () => Promise.resolve(data) });

            await expect(isLegacyBridgeRunning()).resolves.toBe(false);
        },
    );

    it('returns false on invalid json', async () => {
        global.fetch = mockFetchResponse({
            ok: true,
            json: () => Promise.reject(new SyntaxError('Unexpected token')),
        });

        await expect(isLegacyBridgeRunning()).resolves.toBe(false);
    });

    it('returns false on network error', async () => {
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('connect ECONNREFUSED')),
        ) as unknown as typeof fetch;

        await expect(isLegacyBridgeRunning()).resolves.toBe(false);
    });
});
