import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    getMaxStakeAmountFixture,
    getUnstakingPeriodInDaysFixture,
} from './__fixtures__/stakingUtils';
import {
    getMaxStakeAmount,
    getUnstakingPeriodInDays,
    toStakingNetworkSymbol,
} from './stakingUtils';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

describe(toStakingNetworkSymbol.name, () => {
    it('returns the staking network literal for a supported symbol', () => {
        expect(toStakingNetworkSymbol(ethSymbol)).toBe('eth');
    });

    it('returns null for a non-staking symbol', () => {
        expect(toStakingNetworkSymbol(btcSymbol)).toBeNull();
    });
});

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
