import { mockSolanaStakingAccount } from '@suite-common/wallet-types/mocks';
import { MAX_CLAIM_ACCOUNTS } from '@trezor/network-solana/constants';

import {
    getSolanaDeactivatedAccountCount,
    resolveSolanaStakingLimit,
} from './solanaStakingLimitUtils';

describe('resolveSolanaStakingLimit', () => {
    describe('unstake', () => {
        it('does not flag the limit when the whole requested amount can be unstaked', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'unstake',
                    outputAmount: '1000',
                    unstakeAmount: '1000',
                }),
            ).toEqual({ isLimitExceeded: false, estimatedAmount: '1000' });
        });

        it('flags the limit when a single transaction unstakes less than requested', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'unstake',
                    outputAmount: '1000',
                    unstakeAmount: '600',
                }),
            ).toEqual({ isLimitExceeded: true, estimatedAmount: '600' });
        });

        it('treats an exactly-equal amount as within the limit', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'unstake',
                    outputAmount: '1000',
                    unstakeAmount: '1000',
                }).isLimitExceeded,
            ).toBe(false);
        });
    });

    describe('claim', () => {
        it('does not flag a single account whose balance is below its stake plus rent', () => {
            // Mainnet stake account 95XYaPCBXaqvZiecVPJSKV1aKEyoxAtEizyn3g21VnUQ: the delegated
            // stake is 1001731522 and the rent reserve 2282880, yet the balance is only this.
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    totalClaimAmount: '1003397762',
                    deactivatedAccountCount: 1,
                }),
            ).toEqual({ isLimitExceeded: false, estimatedAmount: '1003397762' });
        });

        it('does not flag exactly the maximum number of accounts', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    totalClaimAmount: '1000',
                    deactivatedAccountCount: MAX_CLAIM_ACCOUNTS,
                }),
            ).toEqual({ isLimitExceeded: false, estimatedAmount: '1000' });
        });

        it('flags more accounts than fit into one transaction', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    totalClaimAmount: '1000',
                    deactivatedAccountCount: MAX_CLAIM_ACCOUNTS + 1,
                }),
            ).toEqual({ isLimitExceeded: true, estimatedAmount: '1000' });
        });
    });
});

describe('getSolanaDeactivatedAccountCount', () => {
    it('counts only the deactivated staking accounts', () => {
        expect(getSolanaDeactivatedAccountCount(mockSolanaStakingAccount('none'))).toBe(0);
        expect(getSolanaDeactivatedAccountCount(mockSolanaStakingAccount('active'))).toBe(0);
        expect(getSolanaDeactivatedAccountCount(mockSolanaStakingAccount('deactivated'))).toBe(1);
        expect(getSolanaDeactivatedAccountCount(mockSolanaStakingAccount('mixed'))).toBe(1);
    });
});
