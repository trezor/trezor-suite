import type { TrxStats } from '@suite-common/earn-staking-api';
import {
    type StakingAccount,
    type StakingPosition,
    type StakingProductInfo,
    assertStakingPosition,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_EXTERNAL_SR,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
    type TronStakingScenario,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import { TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';
import { type TronCuratedProductDeps, createTronCuratedProduct } from './product';
import { luganodesProvider } from '../../../providers/luganodes';
import { p2pProvider } from '../../../providers/p2p';

// The oracle is the four P0.1 suites that read Tron: in wallet-core
// src/staking/stakingSelectors.characterization.test.ts,
// src/staking/tron/tronStakingUtils.characterization.test.ts and
// src/staking/shared/stakingUtils.characterization.test.ts, and in wallet-utils
// src/stakingUtils.characterization.test.ts, whose literals are copied here. Products cannot
// import the legacy code, so this file derives the same readings from the position and the
// product info the way P2.5 will, in TRX. The APR stands in for useStakingRate, which the
// P0.1 suites do not cover.
const trxStats: TrxStats = [
    {
        address: MOCK_TRON_P2P_ORG_SR,
        name: 'P2P.ORG',
        url: 'https://www.p2p.org',
        apr: 3.266833,
    },
    {
        address: MOCK_TRON_LUGANODES_SR,
        name: 'Luganodes',
        url: 'https://luganodes.com',
        apr: 3.252901,
    },
];

const product = createTronCuratedProduct({
    networkSymbol: asNetworkSymbol('trx'),
    providers: [luganodesProvider, p2pProvider],
    messageSystemFeatures: TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES,
    ...createMockDeps<TronCuratedProductDeps>({
        getTronStakingStats: () => Promise.resolve(trxStats),
    }),
});

const SECONDS_IN_DAY = 24 * 60 * 60;

const fromSun = (sun: string | BigNumber) => new BigNumber(sun).shiftedBy(-6).toFixed();

const toSun = (trx: string) => new BigNumber(trx).shiftedBy(6).toFixed();

const isPositive = (amount: string) => new BigNumber(amount).gt(0);

type TronReading = {
    position: StakingPosition | null;
    productInfo: StakingProductInfo;
};

const readPosition = async (account: StakingAccount): Promise<TronReading> => {
    const productInfo = await product.fetchProductInfo({});
    const position = product.getPosition({ account, productInfo, transactions: [] });

    if (position !== null) assertStakingPosition(position);

    return { position, productInfo };
};

const getTronStaking = (position: StakingPosition | null) =>
    position?.details?.kind === 'tron-staking' ? position.details : null;

// getTronVotedApr: the APR of the rated representatives weighted by their votes.
const getVotedApr = ({ position, productInfo }: TronReading): number | null => {
    const ratedVotes = (position?.targets ?? []).flatMap(({ address, amount }) => {
        const rate = productInfo.targets.find(target => target.address === address)?.rate;

        return rate === undefined || rate === null ? [] : [{ rate, amount: new BigNumber(amount) }];
    });

    if (ratedVotes.length === 0) return null;

    const totalVotes = BigNumber.sum(...ratedVotes.map(({ amount }) => amount));
    const weightedRate = BigNumber.sum(...ratedVotes.map(({ rate, amount }) => amount.times(rate)));

    return weightedRate.div(totalVotes).toNumber();
};

type LegacyReading = {
    hasStaking: boolean;
    isStakePending: boolean;
    isStakeConfirming: boolean;
    apy: number | null;
    staked: string;
    unstakable: string;
    rewards: string;
    totalStakePending: string;
    claimable: string;
    canClaim: boolean;
    unstaking: string;
    unstakingPeriodInDays: number | null;
    cryptoBalanceWithStaking: string;
};

type ToLegacyReadingParams = {
    account: StakingAccount;
    reading: TronReading;
};

const toLegacyReading = ({ account, reading }: ToLegacyReadingParams): LegacyReading => {
    const { position, productInfo } = reading;
    const balances = position?.balances;
    const staked = balances?.staked ?? '0';
    const pending = balances?.pending ?? '0';
    const unstaking = balances?.unstaking ?? '0';
    const withdrawable = balances?.withdrawable ?? '0';
    const lockedAmounts =
        position?.lockup === 'locked' ? [staked, pending, unstaking, withdrawable] : [];

    return {
        hasStaking: position !== null,
        isStakePending: isPositive(pending),
        isStakeConfirming:
            position?.pendingTransactions.some(({ operation }) => operation === 'stake') ?? false,
        apy: getVotedApr(reading) ?? productInfo.rate,
        staked: fromSun(staked),
        unstakable: fromSun(staked),
        rewards: fromSun(balances?.rewards ?? '0'),
        totalStakePending: fromSun(pending),
        claimable: fromSun(withdrawable),
        canClaim: position?.operations.includes('withdraw') ?? false,
        unstaking: fromSun(unstaking),
        unstakingPeriodInDays: productInfo.exitPeriodDays,
        cryptoBalanceWithStaking: fromSun(
            lockedAmounts.reduce((sum, amount) => sum.plus(amount), new BigNumber(account.balance)),
        ),
    };
};

type LegacyDetailsReading = {
    isActive: boolean;
    votes: { address: string; voteCount: string }[];
    totalVotingPower: string;
    availableVotingPower: string;
    rewards: string;
    rewardClaimCooldownEndsAt: number | null;
    withdrawableBalance: string;
    pendingUnstakeBalance: string;
    pendingUnstakingBatches: { amount: string; expireTime: number }[];
};

// The legacy unstakingBatches list also keeps expired batches with their times; the position
// keeps only their sum, and nothing reads those times, so the list is not compared.
const toLegacyDetailsReading = ({ position }: TronReading): LegacyDetailsReading => {
    const tronStaking = getTronStaking(position);
    const staked = position?.balances.staked ?? '0';
    const rewardClaimAvailableAt = tronStaking?.rewardClaimAvailableAt ?? null;

    return {
        isActive: isPositive(staked),
        votes: (position?.targets ?? []).map(({ address, amount }) => ({
            address,
            voteCount: fromSun(amount),
        })),
        totalVotingPower: fromSun(tronStaking?.votingPower ?? '0'),
        availableVotingPower: fromSun(tronStaking?.unallocatedVotingPower ?? '0'),
        rewards: fromSun(position?.balances.rewards ?? '0'),
        rewardClaimCooldownEndsAt:
            rewardClaimAvailableAt === null ? null : rewardClaimAvailableAt / 1000,
        withdrawableBalance: fromSun(position?.balances.withdrawable ?? '0'),
        pendingUnstakeBalance: fromSun(position?.balances.unstaking ?? '0'),
        pendingUnstakingBatches: (position?.unlocks ?? []).map(({ amount, availableAt }) => ({
            amount: fromSun(amount),
            expireTime: (availableAt ?? 0) / 1000,
        })),
    };
};

type LegacyStakingData = {
    autocompoundBalance: string;
    claimableAmount: string;
    depositedBalance: string;
    pendingBalance: string;
    pendingDepositedBalance: string;
    totalPendingStakeBalance: string;
    restakedReward: string;
    withdrawTotalAmount: string;
    canClaim: boolean;
};

type LegacyUtilsReading = {
    stakingData: LegacyStakingData;
    isActive: boolean;
    hasStakedForAnalytics: boolean;
    providers: string[];
};

// getStakingDataForNetwork reports the whole unfreeze queue as the withdraw total, which is the
// unstaking and the withdrawable amount together.
const toLegacyUtilsReading = ({ position }: TronReading): LegacyUtilsReading => {
    const staked = position === null ? '' : fromSun(position.balances.staked);
    const hasStakedForAnalytics = position !== null && isPositive(position.balances.staked);
    const providers = (position?.targets ?? []).map(({ providerId }) =>
        providerId === 'external' ? 'unknown' : providerId,
    );

    return {
        stakingData: {
            autocompoundBalance: staked,
            claimableAmount: '',
            depositedBalance: staked,
            pendingBalance: '',
            pendingDepositedBalance: '',
            totalPendingStakeBalance: '',
            restakedReward: fromSun(position?.balances.rewards ?? '0'),
            withdrawTotalAmount: fromSun(
                new BigNumber(position?.balances.unstaking ?? '0').plus(
                    position?.balances.withdrawable ?? '0',
                ),
            ),
            canClaim: false,
        },
        isActive: position !== null,
        hasStakedForAnalytics,
        providers: hasStakedForAnalytics ? Array.from(new Set(providers)) : [],
    };
};

const LUGANODES_VOTED_APR = 3.252901;
const SPLIT_VOTED_APR = 3.259867;
const HIGHEST_APR = 3.266833;

// The legacy selectors read apy: null for every Tron account; the generic reading is the APR
// useStakingRate shows today (decision 5 of the P2.4 page).
const TRON_STAKED_READING: LegacyReading = {
    hasStaking: true,
    isStakePending: false,
    isStakeConfirming: false,
    apy: LUGANODES_VOTED_APR,
    staked: '1000',
    unstakable: '1000',
    rewards: '1.5',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 14,
    cryptoBalanceWithStaking: '1500',
};

const LUGANODES_VOTED_DETAILS: LegacyDetailsReading = {
    isActive: true,
    votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '1000' }],
    totalVotingPower: '1000',
    availableVotingPower: '0',
    rewards: '1.5',
    rewardClaimCooldownEndsAt: null,
    withdrawableBalance: '0',
    pendingUnstakeBalance: '0',
    pendingUnstakingBatches: [],
};

const PARTIALLY_UNSTAKED_DETAILS: LegacyDetailsReading = {
    ...LUGANODES_VOTED_DETAILS,
    votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '500' }],
    totalVotingPower: '500',
    pendingUnstakeBalance: '200',
    pendingUnstakingBatches: [
        { amount: '200', expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY },
    ],
};

const tronStakingData = (data: Partial<LegacyStakingData>): LegacyStakingData => ({
    autocompoundBalance: '1000',
    claimableAmount: '',
    depositedBalance: '1000',
    pendingBalance: '',
    pendingDepositedBalance: '',
    totalPendingStakeBalance: '',
    restakedReward: '1.5',
    withdrawTotalAmount: '0',
    canClaim: false,
    ...data,
});

const stakedUtilsReading = (
    providers: string[],
    data: Partial<LegacyStakingData> = {},
): LegacyUtilsReading => ({
    stakingData: tronStakingData(data),
    isActive: true,
    hasStakedForAnalytics: true,
    providers,
});

const SCENARIOS: {
    scenario: TronStakingScenario;
    expected: LegacyReading;
    expectedDetails: LegacyDetailsReading;
    expectedUtils: LegacyUtilsReading;
}[] = [
    {
        scenario: 'none',
        expected: {
            ...TRON_STAKED_READING,
            hasStaking: false,
            apy: HIGHEST_APR,
            // The legacy reading is an empty string, an artifact of the missing staking info.
            staked: '0',
            unstakable: '0',
            rewards: '0',
            cryptoBalanceWithStaking: '500',
        },
        expectedDetails: {
            ...LUGANODES_VOTED_DETAILS,
            isActive: false,
            votes: [],
            totalVotingPower: '0',
            rewards: '0',
        },
        expectedUtils: {
            stakingData: tronStakingData({
                autocompoundBalance: '',
                depositedBalance: '',
                restakedReward: '0',
            }),
            isActive: false,
            hasStakedForAnalytics: false,
            providers: [],
        },
    },
    {
        scenario: 'frozenNotVoted',
        expected: { ...TRON_STAKED_READING, apy: HIGHEST_APR, rewards: '0' },
        expectedDetails: {
            ...LUGANODES_VOTED_DETAILS,
            votes: [],
            availableVotingPower: '1000',
            rewards: '0',
        },
        expectedUtils: stakedUtilsReading([], { restakedReward: '0' }),
    },
    {
        scenario: 'votedLuganodes',
        expected: TRON_STAKED_READING,
        expectedDetails: LUGANODES_VOTED_DETAILS,
        expectedUtils: stakedUtilsReading(['luganodes']),
    },
    {
        scenario: 'votedSplit',
        expected: { ...TRON_STAKED_READING, apy: SPLIT_VOTED_APR },
        expectedDetails: {
            ...LUGANODES_VOTED_DETAILS,
            votes: [
                { address: MOCK_TRON_LUGANODES_SR, voteCount: '500' },
                { address: MOCK_TRON_P2P_ORG_SR, voteCount: '500' },
            ],
        },
        expectedUtils: stakedUtilsReading(['luganodes', 'p2p.org']),
    },
    {
        scenario: 'votedExternal',
        expected: { ...TRON_STAKED_READING, apy: HIGHEST_APR },
        expectedDetails: {
            ...LUGANODES_VOTED_DETAILS,
            votes: [{ address: MOCK_TRON_EXTERNAL_SR, voteCount: '1000' }],
        },
        expectedUtils: stakedUtilsReading(['unknown']),
    },
    {
        scenario: 'unstakingPending',
        expected: {
            ...TRON_STAKED_READING,
            staked: '500',
            unstakable: '500',
            // The legacy readings are 0 and 1000: the generic unstaking reading is the unfreeze
            // queue, and the balance with staking counts it (decisions 1 and 9).
            unstaking: '200',
            cryptoBalanceWithStaking: '1200',
        },
        expectedDetails: PARTIALLY_UNSTAKED_DETAILS,
        expectedUtils: stakedUtilsReading(['luganodes'], {
            autocompoundBalance: '500',
            depositedBalance: '500',
            withdrawTotalAmount: '200',
        }),
    },
    {
        scenario: 'unstakingWithdrawable',
        expected: {
            ...TRON_STAKED_READING,
            staked: '500',
            unstakable: '500',
            // The legacy readings are 300, 0, false and 1000: legacy reports the withdrawable
            // amount as unstaking, never as claimable, and leaves the queue out of the balance
            // with staking (decisions 1 and 9).
            unstaking: '200',
            claimable: '300',
            canClaim: true,
            cryptoBalanceWithStaking: '1500',
        },
        expectedDetails: { ...PARTIALLY_UNSTAKED_DETAILS, withdrawableBalance: '300' },
        expectedUtils: stakedUtilsReading(['luganodes'], {
            autocompoundBalance: '500',
            depositedBalance: '500',
            withdrawTotalAmount: '500',
        }),
    },
    {
        scenario: 'rewardsOnCooldown',
        expected: { ...TRON_STAKED_READING, rewards: '2' },
        expectedDetails: {
            ...LUGANODES_VOTED_DETAILS,
            rewards: '2',
            rewardClaimCooldownEndsAt: MOCK_STAKING_NOW_SECONDS + 23 * 60 * 60,
        },
        expectedUtils: stakedUtilsReading(['luganodes'], { restakedReward: '2' }),
    },
];

describe('tron curated product parity with the P0.1 snapshots', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it.each(SCENARIOS)(
        '$scenario',
        async ({ scenario, expected, expectedDetails, expectedUtils }) => {
            const account = mockTronStakingAccount(scenario);
            const reading = await readPosition(account);

            expect(toLegacyReading({ account, reading })).toEqual(expected);
            expect(toLegacyDetailsReading(reading)).toEqual(expectedDetails);
            expect(toLegacyUtilsReading(reading)).toEqual(expectedUtils);
        },
    );

    it.each<{ scenario: TronStakingScenario; expected: string | null }>([
        { scenario: 'none', expected: null },
        { scenario: 'frozenNotVoted', expected: '1000' },
        { scenario: 'votedSplit', expected: '1000' },
        { scenario: 'votedExternal', expected: '1000' },
        { scenario: 'unstakingPending', expected: '500' },
        { scenario: 'unstakingWithdrawable', expected: '500' },
    ])('$scenario total staking balance', async ({ scenario, expected }) => {
        const { position } = await readPosition(mockTronStakingAccount(scenario));

        expect(position === null ? null : fromSun(position.balances.staked)).toBe(expected);
    });

    // The legacy APY by network is null; the generic one is the highest APR (decision 5).
    it('network readings', async () => {
        const staked = await readPosition(mockTronStakingAccount('votedLuganodes'));
        const notStaked = await readPosition(mockTronStakingAccount('none'));

        expect({
            hasAnyStaked: staked.position !== null,
            hasAnyNotStaked: notStaked.position !== null,
            entryPeriodInDays: staked.productInfo.entryPeriodDays ?? undefined,
            apy: staked.productInfo.rate,
        }).toEqual({
            hasAnyStaked: true,
            hasAnyNotStaked: false,
            entryPeriodInDays: undefined,
            apy: HIGHEST_APR,
        });
    });

    it('trx limits', () => {
        const { limits } = product.descriptor;

        expect({
            MIN_AMOUNT_FOR_STAKING: fromSun(limits.minStakeAmount),
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: fromSun(limits.minStakeAmountForDashboard),
            MAX_AMOUNT_FOR_STAKING: fromSun(limits.maxStakeAmount),
            MIN_FOR_WITHDRAWALS: fromSun(limits.minWithdrawalAmount),
            MIN_BALANCE_FOR_FEE_BUFFER: fromSun(limits.feeBufferBalance),
            MIN_BALANCE_FOR_STAKING: fromSun(limits.minBalanceForStaking),
        }).toEqual({
            MIN_AMOUNT_FOR_STAKING: '1',
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: '1',
            MAX_AMOUNT_FOR_STAKING: '1000000000',
            MIN_FOR_WITHDRAWALS: '0.01',
            MIN_BALANCE_FOR_FEE_BUFFER: '5',
            MIN_BALANCE_FOR_STAKING: '1.01',
        });
    });

    // Not the P0.1 getMaxStakeAmount snapshot, which Tron never reaches: the legacy freeze form
    // keeps TRON_STAKING_RESERVE on Max and checks the fee when it composes.
    it('trx max stake amount', () => {
        const balances = ['0', '0.5', '1', '2', '5', '100', '20000000'];

        expect(
            balances.map(balance =>
                fromSun(
                    product.getAmountBounds({
                        account: mockStakingAccount({
                            symbol: asNetworkSymbol('trx'),
                            balance: toSun(balance),
                            availableBalance: toSun(balance),
                        }),
                        position: null,
                        operation: 'stake',
                        options: {},
                    }).max,
                ),
            ),
        ).toEqual(['0', '0', '0.5', '1.5', '4.5', '99.5', '19999999.5']);
    });

    it('shows the product read-only on mobile, as getMobileStakingSupport does', () => {
        expect(product.descriptor.platforms.mobile).toEqual({ access: 'read-only' });
    });
});
