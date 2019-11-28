import { convertCashAddress } from '../../src/utils/bchaddr';

describe('bchaddrjs address', () => {
    it('convert cash address', () => {
        expect(convertCashAddress('1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')).toBe('1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX');
        expect(convertCashAddress('bitcoincash:pqkh9ahfj069qv8l6eysyufazpe4fdjq3u4hna323j')).toBe('35qL43qYwLdKtnR7yMfGNDvzv6WyZ8yT2n');
    });
});
