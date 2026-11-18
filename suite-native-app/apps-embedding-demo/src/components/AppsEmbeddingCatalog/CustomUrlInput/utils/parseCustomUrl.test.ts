import { parseCustomUrl } from './parseCustomUrl';

describe('parseCustomUrl', () => {
    it.each([
        ['https://example.com/path?query=1', 'https://example.com/path?query=1'],
        ['  https://example.com  ', 'https://example.com'],
        ['example.com', 'https://example.com'],
        ['example.com/guides', 'https://example.com/guides'],
    ])('should accept %p as %p', (value, expectedUrl) => {
        expect(parseCustomUrl(value)).toBe(expectedUrl);
    });

    it.each([
        'http://example.com',
        'ftp://example.com',
        'javascript:alert(1)',
        'trezorsuite://apps-embedding',
        'https://',
        'exa mple.com',
    ])('should refuse %p', value => {
        expect(parseCustomUrl(value)).toBeNull();
    });
});
