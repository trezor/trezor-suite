import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    type TronAccountExtraData,
    type TronStakingInfo,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';

import {
    getResourceGain,
    getTronStakingRewards,
    getTronVotes,
    getTronWithdrawableBalance,
    isSupportedTronStakingNetworkSymbol,
} from './tronStakingUtils';

const TRX = 1_000_000;
const NOW_SECONDS = 1_700_000_000;

const buildStakingInfo = (overrides: Partial<TronStakingInfo> = {}): TronStakingInfo => ({
    stakedBalance: '0',
    stakedBalanceEnergy: '0',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [],
    totalVotingPower: '0',
    availableVotingPower: '0',
    votes: [],
    unclaimedReward: '0',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
    ...overrides,
});

const buildBatch = (amount: string, expireTime: number): TronUnstakingBatch => ({
    amount,
    expireTime,
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

describe('isSupportedTronStakingNetworkSymbol', () => {
    it('returns true for trx', () => {
        expect(isSupportedTronStakingNetworkSymbol(asNetworkSymbol('trx'))).toBe(true);
    });

    it('returns false for non-Tron symbols', () => {
        expect(isSupportedTronStakingNetworkSymbol(asNetworkSymbol('btc'))).toBe(false);
        expect(isSupportedTronStakingNetworkSymbol(asNetworkSymbol('eth'))).toBe(false);
        // testnet Tron is not in the supported list
        expect(isSupportedTronStakingNetworkSymbol(asNetworkSymbol('ttrx'))).toBe(false);
    });
});

describe('getTronStakingRewards', () => {
    it('returns 0 when there is no stakingInfo', () => {
        expect(getTronStakingRewards(buildTronAccount())).toBe('0');
    });

    it('converts the unclaimed reward from Sun to TRX', () => {
        const account = buildTronAccount({
            stakingInfo: buildStakingInfo({ unclaimedReward: String(2 * TRX) }),
        });
        expect(getTronStakingRewards(account)).toBe('2');
    });
});

describe('Tron unstaking balances', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const accountWithBatches = buildTronAccount({
        stakingInfo: buildStakingInfo({
            unstakingBatches: [
                // withdrawable
                buildBatch(String(4 * TRX), NOW_SECONDS - 100),
                // still pending
                buildBatch(String(6 * TRX), NOW_SECONDS + 100),
            ],
        }),
    });

    describe('getTronWithdrawableBalance', () => {
        it('sums only batches whose expireTime has passed', () => {
            expect(getTronWithdrawableBalance(accountWithBatches)).toBe('4');
        });

        it('uses the given time instead of the current one', () => {
            expect(getTronWithdrawableBalance(accountWithBatches, NOW_SECONDS + 100)).toBe('10');
        });

        it('treats a batch expiring exactly now as withdrawable', () => {
            const account = buildTronAccount({
                stakingInfo: buildStakingInfo({
                    unstakingBatches: [buildBatch(String(3 * TRX), NOW_SECONDS)],
                }),
            });
            expect(getTronWithdrawableBalance(account)).toBe('3');
        });
    });
});

describe('getTronVotes', () => {
    it('returns an empty array when no account is provided', () => {
        expect(getTronVotes()).toEqual([]);
    });

    it('returns an empty array when there is no stakingInfo', () => {
        expect(getTronVotes(buildTronAccount())).toEqual([]);
    });

    it('returns the votes when present', () => {
        const votes: TronVote[] = [{ address: 'TSR...', voteCount: '100' }];
        const account = buildTronAccount({ stakingInfo: buildStakingInfo({ votes }) });
        expect(getTronVotes(account)).toBe(votes);
    });
});

const resourceGainResources = {
    totalEnergyLimit: 100,
    totalEnergyWeight: 10,
    totalBandwidthLimit: 200,
    totalBandwidthWeight: 50,
} as TronAccountExtraData;

describe(getResourceGain.name, () => {
    it('computes energy gain (amount × limit / weight)', () => {
        expect(getResourceGain('5', 'energy', resourceGainResources)).toBe(50);
    });

    it('computes bandwidth gain', () => {
        expect(getResourceGain('5', 'bandwidth', resourceGainResources)).toBe(20);
    });

    it('returns null when resources are missing', () => {
        expect(getResourceGain('5', 'energy', undefined)).toBeNull();
    });

    it('returns null when the relevant global is missing or zero', () => {
        expect(
            getResourceGain('5', 'energy', { totalEnergyWeight: 0 } as TronAccountExtraData),
        ).toBeNull();
        expect(getResourceGain('5', 'energy', {} as TronAccountExtraData)).toBeNull();
        expect(
            getResourceGain('5', 'energy', { totalEnergyWeight: 10 } as TronAccountExtraData),
        ).toBeNull();
    });

    it.each(['', '0', '-1', 'abc'])('returns null for invalid amount %p', amount => {
        expect(getResourceGain(amount, 'energy', resourceGainResources)).toBeNull();
    });
});
