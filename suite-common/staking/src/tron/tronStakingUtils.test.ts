import { type TrezorDevice } from '@suite-common/suite-types';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import {
    type TronAccountExtraData,
    type TronStakingInfo,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';
import { type Features } from '@trezor/connect';

import {
    TRON_REWARD_CLAIM_COOLDOWN_SECONDS,
    calculateTronFreezeSuggestion,
    getResourceGain,
    getTronAvailableVotingPower,
    getTronCryptoBalanceWithStaking,
    getTronPendingUnstakeBalance,
    getTronRewardClaimCooldownEndsAt,
    getTronStakingRewards,
    getTronTotalVotingPower,
    getTronUnstakingBalance,
    getTronVotes,
    getTronWithdrawableBalance,
    isSupportedTronStakingNetworkSymbol,
    isTronClaimSupported,
    isTronRewardClaimOnCooldown,
    isTronStakingActive,
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

describe('isTronStakingActive', () => {
    it('returns false for a null account', () => {
        expect(isTronStakingActive(null)).toBe(false);
    });

    it('returns false when there is no stakingInfo', () => {
        expect(isTronStakingActive(buildTronAccount())).toBe(false);
    });

    it('returns false when the staked balance is zero', () => {
        const account = buildTronAccount({ stakingInfo: buildStakingInfo({ stakedBalance: '0' }) });
        expect(isTronStakingActive(account)).toBe(false);
    });

    it('returns true when the staked balance is greater than zero', () => {
        const account = buildTronAccount({
            stakingInfo: buildStakingInfo({ stakedBalance: '1' }),
        });
        expect(isTronStakingActive(account)).toBe(true);
    });
});

describe('getTronCryptoBalanceWithStaking', () => {
    it('returns the spendable balance when there is no stakingInfo', () => {
        const account = buildTronAccount({ formattedBalance: '10' });
        expect(getTronCryptoBalanceWithStaking(account)).toBe('10');
    });

    it('adds the staked balance (in TRX) to the spendable balance', () => {
        const account = buildTronAccount({
            formattedBalance: '10',
            stakingInfo: buildStakingInfo({ stakedBalance: String(5 * TRX) }),
        });
        expect(getTronCryptoBalanceWithStaking(account)).toBe('15');
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

describe('Tron reward claim cooldown', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getTronRewardClaimCooldownEndsAt', () => {
        it('returns null when there is no stakingInfo', () => {
            expect(getTronRewardClaimCooldownEndsAt(buildTronAccount())).toBe(null);
        });

        it('returns null when rewards were never withdrawn', () => {
            const account = buildTronAccount({
                stakingInfo: buildStakingInfo({ latestWithdrawTime: 0 }),
            });
            expect(getTronRewardClaimCooldownEndsAt(account)).toBe(null);
        });

        it('adds the 24h cooldown to the last withdrawal time', () => {
            const account = buildTronAccount({
                stakingInfo: buildStakingInfo({ latestWithdrawTime: NOW_SECONDS }),
            });
            expect(getTronRewardClaimCooldownEndsAt(account)).toBe(
                NOW_SECONDS + TRON_REWARD_CLAIM_COOLDOWN_SECONDS,
            );
        });
    });

    describe('isTronRewardClaimOnCooldown', () => {
        it('returns false when rewards were never withdrawn', () => {
            expect(isTronRewardClaimOnCooldown(buildTronAccount())).toBe(false);
        });

        it('returns true within 24h of the last withdrawal', () => {
            const account = buildTronAccount({
                stakingInfo: buildStakingInfo({ latestWithdrawTime: NOW_SECONDS - 100 }),
            });
            expect(isTronRewardClaimOnCooldown(account)).toBe(true);
        });

        it('returns false once the 24h cooldown has passed', () => {
            const account = buildTronAccount({
                stakingInfo: buildStakingInfo({
                    latestWithdrawTime: NOW_SECONDS - TRON_REWARD_CLAIM_COOLDOWN_SECONDS - 1,
                }),
            });
            expect(isTronRewardClaimOnCooldown(account)).toBe(false);
        });
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

    describe('getTronUnstakingBalance', () => {
        it('returns 0 when there is no stakingInfo', () => {
            expect(getTronUnstakingBalance(buildTronAccount())).toBe('0');
        });

        it('sums all unstaking batches regardless of expiry', () => {
            expect(getTronUnstakingBalance(accountWithBatches)).toBe('10');
        });
    });

    describe('getTronWithdrawableBalance', () => {
        it('sums only batches whose expireTime has passed', () => {
            expect(getTronWithdrawableBalance(accountWithBatches)).toBe('4');
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

    describe('getTronPendingUnstakeBalance', () => {
        it('sums only batches that have not yet expired', () => {
            expect(getTronPendingUnstakeBalance(accountWithBatches)).toBe('6');
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

describe('getTronTotalVotingPower', () => {
    it('returns 0 when there is no stakingInfo', () => {
        expect(getTronTotalVotingPower(buildTronAccount())).toBe('0');
    });

    it('returns the total voting power when present', () => {
        const account = buildTronAccount({
            stakingInfo: buildStakingInfo({ totalVotingPower: '42' }),
        });
        expect(getTronTotalVotingPower(account)).toBe('42');
    });
});

describe('getTronAvailableVotingPower', () => {
    it('returns 0 when there is no stakingInfo', () => {
        expect(getTronAvailableVotingPower(buildTronAccount())).toBe('0');
    });

    it('returns the available voting power when present', () => {
        const account = buildTronAccount({
            stakingInfo: buildStakingInfo({ availableVotingPower: '7' }),
        });
        expect(getTronAvailableVotingPower(account)).toBe('7');
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

const makeTrc20Tx = (overrides: Record<string, unknown> = {}): GeneralPrecomposedTransaction =>
    ({
        type: 'nonfinal',
        feePerByte: '100',
        feeLimit: '100000',
        bytes: 300,
        energyConsumed: 1000,
        token: { name: 'USDT', symbol: 'USDT', decimals: 6, balance: '100000000' },
        totalSpent: '0',
        inputs: [],
        ...overrides,
    }) as unknown as GeneralPrecomposedTransaction;

const makeFreezeResources = (
    overrides: Partial<TronAccountExtraData> = {},
): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 300,
    totalFreeBandwidth: 300,
    availableEnergy: 0,
    totalEnergy: 0,
    totalEnergyLimit: 0,
    totalEnergyWeight: 0,
    totalBandwidthLimit: 0,
    totalBandwidthWeight: 0,
    ...overrides,
});

describe(calculateTronFreezeSuggestion.name, () => {
    it('energy covered — no suggestion', () => {
        expect(
            calculateTronFreezeSuggestion(
                makeTrc20Tx(),
                makeFreezeResources({ availableEnergy: 1000 }),
            ),
        ).toBeNull();
    });

    it('energy short — returns the TRX to freeze for energy', () => {
        // deficit: 1000 energy; limit 1000, weight 100 → 1000 * 100 / 1000 = 100 TRX
        expect(
            calculateTronFreezeSuggestion(
                makeTrc20Tx(),
                makeFreezeResources({
                    availableEnergy: 0,
                    totalEnergyLimit: 1000,
                    totalEnergyWeight: 100,
                }),
            ),
        ).toBe('100');
    });

    it('energy short — rounds the freeze amount up to whole TRX', () => {
        // deficit: 1000 energy; limit 300, weight 100 → 333.33 → 334 TRX
        expect(
            calculateTronFreezeSuggestion(
                makeTrc20Tx(),
                makeFreezeResources({
                    availableEnergy: 0,
                    totalEnergyLimit: 300,
                    totalEnergyWeight: 100,
                }),
            ),
        ).toBe('334');
    });

    it('missing energy conversion params — no suggestion', () => {
        expect(
            calculateTronFreezeSuggestion(
                makeTrc20Tx(),
                makeFreezeResources({ availableEnergy: 0 }),
            ),
        ).toBeNull();
    });

    it('no resources data — no suggestion', () => {
        expect(calculateTronFreezeSuggestion(makeTrc20Tx(), undefined)).toBeNull();
    });
});

const createDevice = (features: Partial<Features>): TrezorDevice =>
    ({
        features: testMocks.getDeviceFeatures(features),
    }) as unknown as TrezorDevice;

const createDeviceWithFirmware = ([major, minor, patch]: [number, number, number]): TrezorDevice =>
    createDevice({ major_version: major, minor_version: minor, patch_version: patch });

describe(isTronClaimSupported.name, () => {
    it('returns false when no device is selected', () => {
        expect(isTronClaimSupported(undefined)).toBe(false);
    });

    it('returns false when device has no features', () => {
        const deviceWithoutFeatures = {} as unknown as TrezorDevice;

        expect(isTronClaimSupported(deviceWithoutFeatures)).toBe(false);
    });

    it('requires firmware 2.12.2', () => {
        expect(isTronClaimSupported(createDeviceWithFirmware([2, 12, 1]))).toBe(false);
        expect(isTronClaimSupported(createDeviceWithFirmware([2, 12, 2]))).toBe(true);
        expect(isTronClaimSupported(createDeviceWithFirmware([2, 13, 0]))).toBe(true);
    });
});
