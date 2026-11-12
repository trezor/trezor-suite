import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { formatStakingAmount } from './formatStakingAmount';

const format = (amount: string, symbol: string) =>
    formatStakingAmount({
        amount: stakingAmountSchema.parse(amount),
        networkSymbol: asNetworkSymbol(symbol),
    });

describe('formatStakingAmount', () => {
    it.each([
        { symbol: 'eth', amount: '2050000000000000000', expected: '2.05' },
        { symbol: 'thod', amount: '100000000000000000', expected: '0.1' },
        { symbol: 'sol', amount: '854795', expected: '0.000854795' },
        { symbol: 'dsol', amount: '5000000000', expected: '5' },
        { symbol: 'ada', amount: '994750000', expected: '994.75' },
        { symbol: 'trx', amount: '1500000', expected: '1.5' },
        { symbol: 'eth', amount: '0', expected: '0' },
    ])('formats $amount on $symbol as $expected', ({ symbol, amount, expected }) => {
        expect(format(amount, symbol)).toBe(expected);
    });

    it('keeps every digit instead of rounding or using an exponent', () => {
        expect(format('1', 'eth')).toBe('0.000000000000000001');
        expect(format('123456789012345678901234567', 'eth')).toBe('123456789.012345678901234567');
    });

    it('leaves the amount as it is for a network it does not know', () => {
        expect(format('123', 'unknown')).toBe('123');
    });
});
