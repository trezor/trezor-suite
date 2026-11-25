import { BigNumber } from '@trezor/utils';

import { estimateStakingRewards } from './stakingRewardsUtils';

const WEEK_DAYS = 365 / 52;
const MONTH_DAYS = 365 / 12;

const rounded = (rewards: string) => new BigNumber(rewards).decimalPlaces(8).toFixed();

describe('estimateStakingRewards', () => {
    it('earns the yearly rate over a year', () => {
        expect(rounded(estimateStakingRewards({ amount: '1000', rate: 3.08 }))).toBe('30.8');
        expect(estimateStakingRewards({ amount: '250', rate: 100, days: 365 })).toBe('250');
    });

    it('compounds a shorter period, so a week and a month earn less than their share of the year', () => {
        expect(rounded(estimateStakingRewards({ amount: '1000', rate: 10, days: WEEK_DAYS }))).toBe(
            '1.83456884',
        );
        expect(
            rounded(estimateStakingRewards({ amount: '1000', rate: 10, days: MONTH_DAYS })),
        ).toBe('7.97414043');
    });

    it('is a plain decimal however small', () => {
        expect(estimateStakingRewards({ amount: '0.00000001', rate: 3 })).toMatch(/^0\.0000000003/);
    });

    it('is nothing without a rate, an amount or a period', () => {
        expect(estimateStakingRewards({ amount: '1000', rate: null })).toBe('0');
        expect(estimateStakingRewards({ amount: '0', rate: 10 })).toBe('0');
        expect(estimateStakingRewards({ amount: '1000', rate: 10, days: 0 })).toBe('0');
    });
});
