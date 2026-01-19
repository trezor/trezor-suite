import { quotaManagerFetch } from '../quotaManagerFetch';

jest.mock('@trezor/env-utils', () => {
    const actual = jest.requireActual('@trezor/env-utils');

    return {
        ...actual,
        getSuiteVersion: jest.fn().mockReturnValue('mockedVersion'),
    };
});

describe(quotaManagerFetch.name, () => {
    it('should call GET with query parameters', async () => {
        const fetchMock = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('{}', { status: 200 }));

        const result = await quotaManagerFetch({
            baseUrl: 'https://example.com',
            path: '/challenge',
            method: 'GET',
            queryParams: { foo: 'bar', count: 10, active: true },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.com/challenge?foo=bar&count=10&active=true',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Suite-Version': 'mockedVersion',
                },
                body: null,
            },
        );

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toEqual({});
    });

    it('should call POST with body', async () => {
        const fetchMock = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }));

        const result = await quotaManagerFetch({
            baseUrl: 'https://example.com',
            path: '/challenge',
            method: 'POST',
            body: { success: true },
        });

        expect(fetchMock).toHaveBeenCalledWith('https://example.com/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Suite-Version': 'mockedVersion',
            },
            body: JSON.stringify({ success: true }),
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toEqual({ success: true });
    });

    it('should handle non-OK response', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response('Not Found', { status: 404, statusText: 'Not Found' }),
        );

        const result = await quotaManagerFetch({
            baseUrl: 'https://example.com',
            path: '/challenge',
            method: 'GET',
        });

        expect(result.success).toBe(false);
        expect(!result.success && result.error).toStrictEqual({
            code: 404,
            message: 'Not Found',
            type: 'HttpError',
        });
    });
});
