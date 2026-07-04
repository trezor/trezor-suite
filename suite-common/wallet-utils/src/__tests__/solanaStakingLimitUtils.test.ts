import { resolveSolanaStakingLimit } from '../solanaStakingLimitUtils';

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
    });

    describe('claim', () => {
        it('subtracts rent reserves before comparing and does not flag when everything fits', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    outputAmount: '900',
                    totalClaimAmount: '1000',
                    rentExemptReserves: ['50', '50'],
                }),
            ).toEqual({ isLimitExceeded: false, estimatedAmount: '1000' });
        });

        it('flags the limit when the claimable stake after rent is below the requested amount', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    outputAmount: '900',
                    totalClaimAmount: '1000',
                    rentExemptReserves: ['100', '100'],
                }),
            ).toEqual({ isLimitExceeded: true, estimatedAmount: '1000' });
        });

        it('handles an empty rent reserve list', () => {
            expect(
                resolveSolanaStakingLimit({
                    type: 'claim',
                    outputAmount: '1000',
                    totalClaimAmount: '1000',
                    rentExemptReserves: [],
                }),
            ).toEqual({ isLimitExceeded: false, estimatedAmount: '1000' });
        });
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
