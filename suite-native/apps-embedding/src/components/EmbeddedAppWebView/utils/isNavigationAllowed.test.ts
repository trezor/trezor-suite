import { isNavigationAllowed } from './isNavigationAllowed';

const allowedOrigins = ['https://example.com', 'https://pay.example.net'];
const mainDocumentURL = 'https://example.com/';

describe('isNavigationAllowed', () => {
    it.each([
        'https://example.com/',
        'https://example.com/path?query=1#section',
        'https://EXAMPLE.com:443/other',
        'https://pay.example.net/checkout',
    ])('should keep the main frame within the allowed origins: %p', url => {
        expect(isNavigationAllowed({ url, isTopFrame: true, allowedOrigins })).toBe(true);
    });

    it.each([
        'https://www.example.com/',
        'https://example.com.evil.io/',
        'http://example.com/',
        'https://example.com:8443/',
        'https://example.net/',
        'tel:123456789',
        'intent://scan#Intent;scheme=zxing;end',
        'trezorsuite://apps-embedding',
        'about:blank',
        'data:text/html,hello',
        'javascript:alert(1)',
        'not a url',
    ])('should block the main frame from leaving the allowed origins: %p', url => {
        expect(isNavigationAllowed({ url, isTopFrame: true, allowedOrigins })).toBe(false);
    });

    it('should hold a request without isTopFrame to the main-frame rule', () => {
        expect(isNavigationAllowed({ url: 'https://example.com/next', allowedOrigins })).toBe(true);
        expect(isNavigationAllowed({ url: 'https://other.example/', allowedOrigins })).toBe(false);
    });

    it('should block everything when no origin is allowed', () => {
        expect(
            isNavigationAllowed({
                url: 'https://example.com/',
                isTopFrame: true,
                allowedOrigins: [],
            }),
        ).toBe(false);
    });

    it('should never match an opaque origin, whatever was allowed', () => {
        expect(
            isNavigationAllowed({
                url: 'tel:123456789',
                isTopFrame: true,
                allowedOrigins: ['null'],
            }),
        ).toBe(false);
    });

    it.each([
        'https://frames.example.net/widget',
        'https://example.com/same-origin-frame',
        'about:blank',
        'about:srcdoc',
        'blob:https://example.com/0c4d3b2a-7f1e-4e3b-9a8d-5c6b7a8d9e0f',
        'data:text/html,hello',
    ])('should let a subframe load the web and its own content: %p', url => {
        expect(
            isNavigationAllowed({ url, isTopFrame: false, mainDocumentURL, allowedOrigins }),
        ).toBe(true);
    });

    it.each([
        'tel:123456789',
        'sms:123456789',
        'trezorsuite://apps-embedding',
        'intent://scan#Intent;scheme=zxing;end',
        'mailto:hello@example.com',
        'http://frames.example.net/widget',
        'javascript:alert(1)',
        'not a url',
    ])('should refuse a subframe every scheme that leaves the web: %p', url => {
        expect(
            isNavigationAllowed({ url, isTopFrame: false, mainDocumentURL, allowedOrigins }),
        ).toBe(false);
    });

    it('should hold a subframe request without mainDocumentURL to the main-frame rule', () => {
        expect(
            isNavigationAllowed({
                url: 'https://frames.example.net/widget',
                isTopFrame: false,
                allowedOrigins,
            }),
        ).toBe(false);
        expect(isNavigationAllowed({ url: 'about:blank', isTopFrame: false, allowedOrigins })).toBe(
            false,
        );
        expect(
            isNavigationAllowed({
                url: 'https://example.com/next',
                isTopFrame: false,
                allowedOrigins,
            }),
        ).toBe(true);
    });
});
