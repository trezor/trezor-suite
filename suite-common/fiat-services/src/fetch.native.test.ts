import { fetchUrl, requestInit } from './fetch.native';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper function to create RequestInit objects for testing
const createRequestInit = (overrides: Partial<RequestInit> = {}): RequestInit => ({
    ...requestInit,
    ...overrides,
});

// Helper function to create custom init configurations
const createCustomInit = (config: {
    headers?: HeadersInit;
    method?: string;
    body?: string;
}): RequestInit => ({
    ...(config.method && { method: config.method }),
    ...(config.body && { body: config.body }),
    ...(config.headers && { headers: config.headers }),
});

describe('fetch.native', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('fetchUrl', () => {
        test('calls fetch with default headers when no init provided', () => {
            const url = 'https://api.example.com/data';
            const expectedInit = createRequestInit();

            fetchUrl(url);

            expect(mockFetch).toHaveBeenCalledWith(url, expectedInit);
        });

        test('merges custom headers with default headers', () => {
            const url = 'https://api.example.com/data';
            const customInit = createCustomInit({
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer token',
                },
            });
            const expectedInit = createRequestInit({
                headers: {
                    'User-Agent': 'Trezor Suite',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer token',
                },
            });

            fetchUrl(url, customInit);

            expect(mockFetch).toHaveBeenCalledWith(url, expectedInit);
        });

        test('overrides default headers when custom headers have same keys', () => {
            const url = 'https://api.example.com/data';
            const customInit = createCustomInit({
                headers: {
                    'User-Agent': 'Custom Agent',
                },
            });
            const expectedInit = createRequestInit({
                headers: {
                    'User-Agent': 'Custom Agent',
                },
            });

            fetchUrl(url, customInit);

            expect(mockFetch).toHaveBeenCalledWith(url, expectedInit);
        });

        test('preserves other init properties while merging headers', () => {
            const url = 'https://api.example.com/data';
            const customInit = createCustomInit({
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const expectedInit = createRequestInit({
                headers: {
                    'User-Agent': 'Trezor Suite',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
            });

            fetchUrl(url, customInit);

            expect(mockFetch).toHaveBeenCalledWith(url, expectedInit);
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['empty string', ''],
        ])('handles %s headers gracefully', (type, headersValue) => {
            const url = 'https://api.example.com/data';
            const customInit =
                type === 'null'
                    ? { method: 'GET', headers: headersValue as any }
                    : createCustomInit({
                          method: 'GET',
                          headers: headersValue as unknown as HeadersInit,
                      });
            const expectedInit = createRequestInit({
                headers: {
                    'User-Agent': 'Trezor Suite',
                },
                method: 'GET',
            });

            fetchUrl(url, customInit);

            expect(mockFetch).toHaveBeenCalledWith(url, expectedInit);
        });
    });
});
