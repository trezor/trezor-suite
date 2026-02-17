import { ParsedUrl, parseUrl } from '../urlParse';

describe('parseUrl', () => {
    describe('basic pathname parsing', () => {
        it('should parse simple pathname', () => {
            const result = parseUrl('/oauth');
            expect(result).toEqual({
                pathname: '/oauth',
                search: undefined,
                query: {},
            });
        });

        it('should parse pathname with trailing slash', () => {
            const result = parseUrl('/buy-redirect/');
            expect(result).toEqual({
                pathname: '/buy-redirect/',
                search: undefined,
                query: {},
            });
        });

        it('should parse nested pathname', () => {
            const result = parseUrl('/api/v1/users');
            expect(result).toEqual({
                pathname: '/api/v1/users',
                search: undefined,
                query: {},
            });
        });
    });

    describe('search and query parameter parsing', () => {
        it('should parse single query parameter', () => {
            const result = parseUrl('/oauth?code=abc123');
            expect(result).toEqual({
                pathname: '/oauth',
                search: '?code=abc123',
                query: { code: 'abc123' },
            });
        });

        it('should parse multiple query parameters', () => {
            const result = parseUrl('/buy-redirect?p=payment&id=123');
            expect(result).toEqual({
                pathname: '/buy-redirect',
                search: '?p=payment&id=123',
                query: { p: 'payment', id: '123' },
            });
        });

        it('should parse multiple values for same parameter as array', () => {
            const result = parseUrl('/api?item=a&item=b&item=c');
            expect(result.pathname).toBe('/api');
            expect(Array.isArray(result.query.item)).toBe(true);
            expect(result.query.item).toEqual(['a', 'b', 'c']);
        });

        it('should handle empty parameter value', () => {
            const result = parseUrl('/oauth?code=&state=123');
            expect(result.query.code).toBe('');
            expect(result.query.state).toBe('123');
        });

        it('should decode URL-encoded parameters', () => {
            const result = parseUrl('/oauth?redirect_uri=https%3A%2F%2Fexample.com');
            expect(result.query.redirect_uri).toBe('https://example.com');
        });

        it('should handle special characters in query parameters', () => {
            const result = parseUrl('/oauth?email=user%40example.com&name=John%20Doe');
            expect(result.query.email).toBe('user@example.com');
            expect(result.query.name).toBe('John Doe');
        });
    });

    describe('edge cases', () => {
        it('should handle root path', () => {
            const result = parseUrl('/');
            expect(result).toEqual({
                pathname: '/',
                search: undefined,
                query: {},
            });
        });

        it('should handle URL with hash (fragment)', () => {
            const result = parseUrl('/oauth#access_token=abc123');
            expect(result.pathname).toBe('/oauth');
            // Hash is not included in query parameters by url.parse
        });

        it('should handle pathname without leading slash', () => {
            const result = parseUrl('oauth?code=123');
            expect(result.pathname).toBe('oauth');
            expect(result.query.code).toBe('123');
        });

        it('should parse complex real-world OAuth redirect', () => {
            const result = parseUrl(
                '/buy-post?a=https%3A%2F%2Fexample.com&param1=value1&param2=value2',
            );
            expect(result.pathname).toBe('/buy-post');
            expect(result.query.a).toBe('https://example.com');
            expect(result.query.param1).toBe('value1');
            expect(result.query.param2).toBe('value2');
        });

        it('should handle Dropbox OAuth response with state', () => {
            const result = parseUrl('/oauth?code=ABC123DEF456&state=random_state_value');
            expect(result.pathname).toBe('/oauth');
            expect(result.query.code).toBe('ABC123DEF456');
            expect(result.query.state).toBe('random_state_value');
        });

        it('should return empty query object when no parameters', () => {
            const result = parseUrl('/sell-redirect');
            expect(result.query).toEqual({});
        });

        it('should handle question mark without parameters', () => {
            const result = parseUrl('/oauth?');
            expect(result.pathname).toBe('/oauth');
            expect(result.query).toEqual({});
        });

        it('should preserve query structure for type safety', () => {
            const result: ParsedUrl = parseUrl('/api?status=active');
            expect(typeof result.pathname).toBe('string');
            expect(['string', 'undefined']).toContain(typeof result.search);
            expect(typeof result.query).toBe('object');
        });
    });

    describe('consistency with url.parse behavior', () => {
        it('should handle URL with multiple slashes', () => {
            const result = parseUrl('//api//users');
            expect(result.pathname).toBe('//api//users');
        });

        it('should preserve parameter order in URL string (but not in object)', () => {
            const result = parseUrl('/api?z=1&a=2&m=3');
            expect(result.query).toEqual({ z: '1', a: '2', m: '3' });
        });

        it('should handle plus signs in query parameters (converted to spaces)', () => {
            const result = parseUrl('/api?search=hello+world');
            // Note: url.parse converts + to space in query parameters (standard URL decoding)
            expect(result.query.search).toBe('hello world');
        });
    });
});
