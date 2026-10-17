import { isNavigationAllowed } from './isNavigationAllowed';

const allowedOrigin = 'https://example.com';

describe('isNavigationAllowed', () => {
    it.each([
        'https://example.com/',
        'https://example.com/path?query=1#section',
        'https://EXAMPLE.com:443/other',
    ])('should keep the main frame on the opened origin: %p', url => {
        expect(isNavigationAllowed({ url, isTopFrame: true, allowedOrigin })).toBe(true);
    });

    it.each([
        'https://www.example.com/',
        'https://example.com.evil.io/',
        'http://example.com/',
        'https://example.com:8443/',
        'tel:123456789',
        'intent://scan#Intent;scheme=zxing;end',
        'trezorsuite://apps-embedding',
        'about:blank',
        'data:text/html,hello',
        'javascript:alert(1)',
        'not a url',
    ])('should block the main frame from leaving the opened origin: %p', url => {
        expect(isNavigationAllowed({ url, isTopFrame: true, allowedOrigin })).toBe(false);
    });

    it('should hold a request without isTopFrame to the main-frame rule', () => {
        expect(isNavigationAllowed({ url: 'https://example.com/next', allowedOrigin })).toBe(true);
        expect(isNavigationAllowed({ url: 'https://other.example/', allowedOrigin })).toBe(false);
    });

    it('should never match an opaque origin, whatever was allowed', () => {
        expect(
            isNavigationAllowed({ url: 'tel:123456789', isTopFrame: true, allowedOrigin: 'null' }),
        ).toBe(false);
    });

    it('should leave subframe navigation unrestricted', () => {
        expect(
            isNavigationAllowed({
                url: 'https://frames.example.net/widget',
                isTopFrame: false,
                allowedOrigin,
            }),
        ).toBe(true);
    });
});
