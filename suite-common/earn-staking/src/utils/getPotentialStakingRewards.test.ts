import { type StakingProductLimits, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';

import { getPotentialStakingRewards } from './getPotentialStakingRewards';

const amount = (value: string) => stakingAmountSchema.parse(value);

// 0.1 ETH minimum stake and no deposit.
const { limits } = mockStakingProductDescriptor();

// 1 ADA minimum stake and a 2 ADA registration deposit.
const cardanoLimits: StakingProductLimits = {
    ...limits,
    minStakeAmount: amount('1000000'),
    registrationDeposit: amount('2000000'),
};

describe('getPotentialStakingRewards', () => {
    it('earns the rate on the available balance for a year', () => {
        expect(
            getPotentialStakingRewards({
                accounts: [{ availableBalance: '1500000000000000000' }],
                limits,
                rate: 3.08,
            }),
        ).toBe('46200000000000000');
    });

    it('sums the accounts at or above the minimum stake and skips the others', () => {
        expect(
            getPotentialStakingRewards({
                accounts: [
                    { availableBalance: '1500000000000000000' },
                    { availableBalance: '50000000000000000' },
                    { availableBalance: '100000000000000000' },
                ],
                limits,
                rate: 10,
            }),
        ).toBe('160000000000000000');
    });

    it('subtracts the registration deposit and never goes below zero', () => {
        expect(
            getPotentialStakingRewards({
                accounts: [{ availableBalance: '1000000000' }],
                limits: cardanoLimits,
                rate: 2.4,
            }),
        ).toBe('23952000');
        expect(
            getPotentialStakingRewards({
                accounts: [{ availableBalance: '1500000' }],
                limits: cardanoLimits,
                rate: 2.4,
            }),
        ).toBe('0');
    });

    it('rounds down to a whole base unit', () => {
        expect(
            getPotentialStakingRewards({
                accounts: [{ availableBalance: '100000000000000003' }],
                limits,
                rate: 1,
            }),
        ).toBe('1000000000000000');
    });

    it('is zero without a rate, without limits or without accounts', () => {
        const accounts = [{ availableBalance: '1500000000000000000' }];

        expect(getPotentialStakingRewards({ accounts, limits, rate: null })).toBe('0');
        expect(getPotentialStakingRewards({ accounts, limits: null, rate: 3.08 })).toBe('0');
        expect(getPotentialStakingRewards({ accounts: [], limits, rate: 3.08 })).toBe('0');
    });
});
