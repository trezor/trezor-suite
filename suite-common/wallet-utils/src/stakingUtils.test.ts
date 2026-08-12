import {
    getMaxStakeAmountFixture,
    getUnstakingPeriodInDaysFixture,
} from './__fixtures__/stakingUtils';
import { calculateRewards, getMaxStakeAmount, getUnstakingPeriodInDays } from './stakingUtils';

describe('getUnstakingPeriodInDays', () => {
    getUnstakingPeriodInDaysFixture.forEach(test => {
        it(test.description, () => {
            const result = getUnstakingPeriodInDays(test.args.networkType, {
                withdrawTime: test.args.withdrawTime,
                exitTime: test.args.exitTime,
            });
            expect(result).toEqual(test.result);
        });
    });
});

describe('getMaxStakeAmount', () => {
    getMaxStakeAmountFixture.forEach(test => {
        it(test.description, () => {
            const result = getMaxStakeAmount({
                balance: test.args.balance,
                symbol: test.args.symbol,
            });
            expect(result).toEqual(test.result);
        });
    });
});

describe('calculateRewards', () => {
    it('returns a full year of rewards at the precision of the inputs, with no float noise', () => {
        expect(calculateRewards('0.5', 3.21)).toBe('0.01605');
        expect(calculateRewards('123.456', 2.5)).toBe('3.0864');
    });

    it('compounds a partial year', () => {
        expect(Number(calculateRewards('100', 5, 182.5))).toBeCloseTo(2.4695076596, 8);
    });

    it('returns no rewards for an unknown APY', () => {
        expect(calculateRewards('0.5', null)).toBe('0');
    });
});
