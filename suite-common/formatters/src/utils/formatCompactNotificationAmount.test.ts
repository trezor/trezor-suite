import {
    formatCompactNotificationNetworkAmount,
    formatCompactNotificationTokenAmount,
} from './formatCompactNotificationAmount';

describe(formatCompactNotificationNetworkAmount.name, () => {
    it.each([
        // [amount (subunits), symbol, isSatoshis, expected]
        ['2500000000000000000', 'eth', undefined, '2.50 ETH'],
        // below one keeps up to five decimals
        ['123456000000000000', 'eth', undefined, '0.12345 ETH'],
        // dust is collapsed behind the minimum
        ['5000000000000', 'eth', undefined, '<0.00001 ETH'],
        // satoshis stay as an integer subunit count and are not compacted
        ['123456', 'btc', true, '123456 sat BTC'],
    ] as const)('formats %s %s', (amount, symbol, isSatoshis, expected) => {
        expect(formatCompactNotificationNetworkAmount(amount, symbol, isSatoshis)).toBe(expected);
    });
});

describe(formatCompactNotificationTokenAmount.name, () => {
    it.each([
        // money-like (6 decimals) renders with two decimals
        [{ amount: '12500000', decimals: 6, symbol: 'USDC' }, '12.50 USDC'],
        // money-like dust uses the higher <0.01 threshold
        [{ amount: '4000', decimals: 6, symbol: 'USDC' }, '<0.01 USDC'],
        // non-money tokens compact to two decimals above one
        [{ amount: '3999900000000000000', decimals: 18, symbol: 'SHIB' }, '3.99 SHIB'],
        // a missing symbol yields the bare amount
        [{ amount: '2500000000000000000', decimals: 18, symbol: '' }, '2.50'],
    ] as const)('formats %o', (tokenTransfer, expected) => {
        expect(formatCompactNotificationTokenAmount(tokenTransfer)).toBe(expected);
    });
});
