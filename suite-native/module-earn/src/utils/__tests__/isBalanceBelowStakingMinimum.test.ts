import { type Account } from '@suite-common/wallet-types';

import { isBalanceBelowStakingMinimum } from '../isBalanceBelowStakingMinimum';

const createMockAccount = (symbol: Account['symbol'], availableBalance: string): Account =>
    ({ symbol, availableBalance }) as Account;

describe('isBalanceBelowStakingMinimum', () => {
    it('returns true when the ETH balance is below the min stake plus fee buffer', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('eth', '10000000000000000'))).toBe(
            true,
        );
    });

    it('returns true when the ETH balance is just below the threshold', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('eth', '14000000000000000'))).toBe(
            true,
        );
    });

    it('returns false when the ETH balance equals the threshold', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('eth', '15000000000000000'))).toBe(
            false,
        );
    });

    it('returns false when the ETH balance is above the threshold', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('eth', '20000000000000000'))).toBe(
            false,
        );
    });

    it('returns true when the SOL balance is below the min stake plus fee buffer', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('sol', '1000000000'))).toBe(true);
    });

    it('returns false when the SOL balance is above the threshold', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('sol', '2000000000'))).toBe(false);
    });

    it('returns false for a network that does not support staking', () => {
        expect(isBalanceBelowStakingMinimum(createMockAccount('btc', '0'))).toBe(false);
    });
});
