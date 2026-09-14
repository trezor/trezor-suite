import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import {
    getMaxStakeAmountFixture,
    getUnstakingPeriodInDaysFixture,
} from './__fixtures__/stakingUtils';
import { getMaxStakeAmount, getUnstakingPeriodInDays } from './stakingUtils';

const networkConfigDeps = mockNetworkConfigDeps();

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
            const result = getMaxStakeAmount(networkConfigDeps, {
                balance: test.args.balance,
                symbol: test.args.symbol,
            });
            expect(result).toEqual(test.result);
        });
    });
});
