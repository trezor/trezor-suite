import { formatBitcoin, sumSatoshi } from './formatAmount';

describe('formatBitcoin', () => {
    it.each([
        ['0', '0.00000000 BTC'],
        ['1', '0.00000001 BTC'],
        ['12345', '0.00012345 BTC'],
        ['100000000', '1.00000000 BTC'],
        ['2100000000000000', '21000000.00000000 BTC'],
        ['123456789012', '1234.56789012 BTC'],
    ])('formats %s satoshi as %s', (satoshi, formatted) => {
        expect(formatBitcoin(satoshi)).toBe(formatted);
    });

    it.each(['', 'abc', '-5', '1.5', '1e8'])(
        'does not throw on the malformed amount "%s"',
        satoshi => {
            expect(formatBitcoin(satoshi)).toBe('unknown amount');
        },
    );
});

describe('sumSatoshi', () => {
    it('adds amounts beyond the safe integer range exactly', () => {
        expect(sumSatoshi(['9007199254740993', '1'])).toBe(9007199254740994n);
        expect(sumSatoshi([])).toBe(0n);
    });
});
