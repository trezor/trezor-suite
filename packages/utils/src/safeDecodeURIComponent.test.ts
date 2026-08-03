import { safeDecodeURIComponent } from './safeDecodeURIComponent';

describe('safeDecodeURIComponent', () => {
    it.each([
        { description: 'plain string', value: 'hello', result: 'hello' },
        { description: 'percent-encoded space', value: 'a%20b', result: 'a b' },
        { description: 'percent-encoded slash', value: '%2Fpath', result: '/path' },
        { description: 'empty string', value: '', result: '' },
    ])('decodes $description', ({ value, result }) => {
        expect(safeDecodeURIComponent(value)).toBe(result);
    });

    it.each([
        { description: 'a lone percent sign', value: '%' },
        { description: 'an incomplete escape', value: '%2' },
        { description: 'a non-hex escape', value: '%zz' },
        { description: 'a trailing malformed escape', value: 'ok%' },
    ])('returns null for $description instead of throwing', ({ value }) => {
        expect(() => safeDecodeURIComponent(value)).not.toThrow();
        expect(safeDecodeURIComponent(value)).toBeNull();
    });
});
