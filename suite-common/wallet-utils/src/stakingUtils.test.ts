import { type Account } from '@suite-common/wallet-types';
import { type TronStakingInfo, type TronUnstakingBatch } from '@trezor/blockchain-link-types';

import {
    getAccountEverstakeStakingPoolFixtures,
    getEthAccountTotalStakingBalanceFixtures,
} from './__fixtures__/stakingUtils';
import {
    getAccountEverstakeStakingPool,
    getEthAccountTotalStakingBalance,
    getTronAccountTotalStakingBalance,
} from './stakingUtils';

const TRX = 1_000_000;

const buildStakingInfo = (overrides: Partial<TronStakingInfo> = {}): TronStakingInfo => ({
    stakedBalance: '0',
    stakedBalanceEnergy: '0',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [] as TronUnstakingBatch[],
    totalVotingPower: '0',
    availableVotingPower: '0',
    votes: [],
    unclaimedReward: '0',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
    ...overrides,
});

interface TronAccountOverrides {
    formattedBalance?: string;
    stakingInfo?: TronStakingInfo;
}

const buildTronAccount = ({
    formattedBalance = '0',
    stakingInfo,
}: TronAccountOverrides = {}): Account =>
    ({
        symbol: 'trx',
        networkType: 'tron',
        formattedBalance,
        misc: {
            tronResources: {
                availableStakedBandwidth: 0,
                totalStakedBandwidth: 0,
                availableFreeBandwidth: 0,
                totalFreeBandwidth: 0,
                availableEnergy: 0,
                totalEnergy: 0,
                totalEnergyLimit: 0,
                totalEnergyWeight: 0,
                totalBandwidthLimit: 0,
                totalBandwidthWeight: 0,
                stakingInfo,
            },
        },
    }) as unknown as Account;

describe('getAccountEverstakeStakingPool', () => {
    getAccountEverstakeStakingPoolFixtures.forEach(({ description, account, expected }) => {
        it(description, () => {
            const result = getAccountEverstakeStakingPool(account as unknown as Account);
            expect(result).toEqual(expected);
        });
    });
});

describe('getEthAccountTotalStakingBalance', () => {
    getEthAccountTotalStakingBalanceFixtures.forEach(
        ({ description, account, expectedBalance }) => {
            it(description, () => {
                const result = getEthAccountTotalStakingBalance(account as unknown as Account);
                expect(result).toEqual(expectedBalance);
            });
        },
    );
});

describe('getTronAccountTotalStakingBalance', () => {
    it('returns null when there is no stakingInfo', () => {
        expect(getTronAccountTotalStakingBalance(buildTronAccount())).toBeNull();
    });

    it('converts the staked balance from Sun to TRX', () => {
        const account = buildTronAccount({
            stakingInfo: buildStakingInfo({ stakedBalance: String(5 * TRX) }),
        });
        expect(getTronAccountTotalStakingBalance(account)).toBe('5');
    });
});
