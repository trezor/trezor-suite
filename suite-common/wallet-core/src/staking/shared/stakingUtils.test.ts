import { type Account } from '@suite-common/wallet-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import {
    getMaxStakeAmountFixture,
    getUnstakingPeriodInDaysFixture,
} from './__fixtures__/stakingUtils';
import {
    getMaxStakeAmount,
    getStakingProvidersForAnalytics,
    getUnstakingPeriodInDays,
} from './stakingUtils';

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

const createEthereumStakingAccount = (contract: string): Account =>
    ({
        symbol: 'eth',
        networkType: 'ethereum',
        misc: {
            stakingPools: [
                {
                    name: 'Everstake',
                    contract,
                    autocompoundBalance: '1000000000000000000',
                    claimableAmount: '0',
                    depositedBalance: '1000000000000000000',
                    pendingBalance: '0',
                    pendingDepositedBalance: '0',
                    restakedReward: '0',
                    withdrawTotalAmount: '0',
                },
            ],
        },
    }) as unknown as Account;

describe(getStakingProvidersForAnalytics.name, () => {
    it('identifies an Ethereum pool by its accounting contract', () => {
        const account = createEthereumStakingAccount(
            EVERSTAKE_CONTRACTS[1].accounting.toLowerCase(),
        );

        expect(getStakingProvidersForAnalytics([account])).toEqual(['everstake']);
    });

    it('reports an unknown Ethereum pool contract as unknown', () => {
        const account = createEthereumStakingAccount('0x624087DD1904ab122A32878Ce9e933C7071F53B9');

        expect(getStakingProvidersForAnalytics([account])).toEqual(['unknown']);
    });
});
