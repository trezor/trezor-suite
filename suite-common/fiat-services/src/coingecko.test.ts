import { findClosestTimestampValue, sanitizePrices } from './coingecko';

describe('sanitizePrices', () => {
    test('passes a well-formed prices array through unchanged', () => {
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
        ];
        expect(sanitizePrices(prices)).toEqual(prices);
    });

    test('coerces a non-array (poison) response to an empty array', () => {
        // Untrusted Coingecko/CDN responses can be any shape.
        expect(sanitizePrices(undefined)).toEqual([]);
        expect(sanitizePrices(null)).toEqual([]);
        expect(sanitizePrices({ length: 3 })).toEqual([]);
        expect(sanitizePrices('deadbeef')).toEqual([]);
        expect(sanitizePrices(42)).toEqual([]);
    });

    test('drops poison entries while keeping valid tuples', () => {
        const prices = [
            [1631779200000, 100],
            null,
            [1631782800000], // missing rate
            ['not-a-number', 200],
            [1631786400000, 300],
            {},
        ];
        expect(sanitizePrices(prices)).toEqual([
            [1631779200000, 100],
            [1631786400000, 300],
        ]);
    });

    test('does not throw on a fully poison array', () => {
        expect(() => sanitizePrices([null, undefined, {}, 'x', [null, null]])).not.toThrow();
        expect(sanitizePrices([null, undefined, {}, 'x', [null, null]])).toEqual([]);
    });
});

describe('findClosestTimestampValue', () => {
    test('returns the first fiat rate when timestamp is before all values', () => {
        const timestamp = 1631779100;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(100);
    });

    test('returns the correct fiat rate when timestamp is exact match', () => {
        const timestamp = 1631782800;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(200);
    });

    test('returns the closest fiat rate when timestamp is between two values', () => {
        const timestamp = 1631782900;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(200);
    });

    test('returns the last fiat rate when timestamp is after all values', () => {
        const timestamp = 1631787000;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(300);
    });
});
