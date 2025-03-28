import { getUnstakingPeriodInDaysFixture } from '../__fixtures__/stakingUtils';
import { getUnstakingPeriodInDays } from '../stakingUtils';

describe('getUnstakingPeriodInDays', () => {
    getUnstakingPeriodInDaysFixture.forEach(test => {
        it(test.description, async () => {
            const result = await getUnstakingPeriodInDays({
                networkType: test.args.networkType,
                validatorWithdrawTime: test.args.validatorWithdrawTime,
                validatorExitTime: test.args.validatorExitTime,
            });
            expect(result).toEqual(test.result);
        });
    });
});
