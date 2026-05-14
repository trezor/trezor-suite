import { getUnstakingPeriodInDaysFixture } from '../__fixtures__/stakingUtils';
import { getUnstakingPeriodInDays } from '../stakingUtils';

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
