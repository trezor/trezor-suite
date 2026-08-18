import { getEarnPendingAmountInBaseUnits } from './getEarnPendingAmountInBaseUnits';

const precomposedTransaction = { totalSpent: '2280000', fee: '280000' };

describe('getEarnPendingAmountInBaseUnits', () => {
    it('returns the fallback amount for non-Solana staking', () => {
        expect(
            getEarnPendingAmountInBaseUnits({
                fallbackAmountInBaseUnits: '1000000',
                isSolanaStaking: false,
                precomposedTransaction,
            }),
        ).toBe('1000000');
    });

    it('returns the composed net amount (totalSpent - fee) for Solana staking', () => {
        expect(
            getEarnPendingAmountInBaseUnits({
                fallbackAmountInBaseUnits: '1000000',
                isSolanaStaking: true,
                precomposedTransaction,
            }),
        ).toBe('2000000');
    });

    it('returns the fallback amount for Solana staking when there is no composed transaction', () => {
        expect(
            getEarnPendingAmountInBaseUnits({
                fallbackAmountInBaseUnits: '1000000',
                isSolanaStaking: true,
                precomposedTransaction: undefined,
            }),
        ).toBe('1000000');
    });
});
