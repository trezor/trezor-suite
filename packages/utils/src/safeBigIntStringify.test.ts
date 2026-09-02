import { safeBigIntStringify } from './safeBigIntStringify';

describe('safeStringify', () => {
    it('serializes regular objects normally', () => {
        const obj = { a: 1, b: 'text', c: true, d: null };
        expect(safeBigIntStringify(obj)).toBe(JSON.stringify(obj));
    });

    it('converts BigInt values to strings', () => {
        const x = { val: 1234567890123456789n };
        const json = safeBigIntStringify(x);
        // Should not throw and should include quoted bigint
        expect(json).toBe('{"val":"1234567890123456789"}');
    });

    it('serializes nested BigInt in arrays and objects', () => {
        const x = { arr: [1n, { nested: 2n }, 3] };
        expect(safeBigIntStringify(x)).toBe('{"arr":["1",{"nested":"2"},3]}');
    });

    it('does not modify non-BigInt values', () => {
        const x = { num: 42, str: 'hello', bool: false };
        expect(safeBigIntStringify(x)).toBe(JSON.stringify(x));
    });
});
