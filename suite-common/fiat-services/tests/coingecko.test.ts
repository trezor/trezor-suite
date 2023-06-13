import { findClosestTimestampValue } from '../src/coingecko';

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
