import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Account, StakingPoolExtended } from '@suite-common/wallet-types';
import {
    type CardanoStakingScenario,
    type EthereumStakingScenario,
    MOCK_ETHEREUM_EVERSTAKE_CONTRACT,
    MOCK_STAKING_NOW_SECONDS,
    type SolanaStakingScenario,
    type TronStakingScenario,
    mockCardanoStakingAccount,
    mockEthereumStakingAccount,
    mockSolanaStakingAccount,
    mockTronStakingAccount,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';

import {
    getMaxStakeAmount,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
    getStakingProvidersForAnalytics,
    hasAccountStakedForAnalytics,
    isAccountStakingActive,
} from './stakingUtils';
import { mockEthereumStakingTransaction } from '../../../mocks';

type StakingUtilsReading = {
    stakingData: Partial<StakingPoolExtended> | undefined;
    isActive: boolean;
    hasStakedForAnalytics: boolean;
    providers: string[];
};

const readStakingUtils = (account: Account): StakingUtilsReading => ({
    stakingData: getStakingDataForNetwork(account),
    isActive: isAccountStakingActive(account, []),
    hasStakedForAnalytics: hasAccountStakedForAnalytics(account),
    providers: getStakingProvidersForAnalytics([account]),
});

const everstakePoolData = (pool: Partial<StakingPoolExtended>): Partial<StakingPoolExtended> => ({
    contract: MOCK_ETHEREUM_EVERSTAKE_CONTRACT,
    name: 'Everstake',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    depositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: '0',
    restakedReward: '0',
    autocompoundBalance: '0',
    totalPendingStakeBalance: '0',
    canClaim: false,
    ...pool,
});

const solanaStakingData = (data: Partial<StakingPoolExtended>): Partial<StakingPoolExtended> => ({
    autocompoundBalance: '0',
    claimableAmount: '0',
    depositedBalance: '0',
    pendingBalance: '',
    pendingDepositedBalance: '',
    totalPendingStakeBalance: '0',
    restakedReward: '',
    withdrawTotalAmount: '0',
    canClaim: false,
    ...data,
});

const cardanoStakingData = (data: Partial<StakingPoolExtended>): Partial<StakingPoolExtended> => ({
    autocompoundBalance: '1000',
    claimableAmount: '',
    depositedBalance: '1000',
    pendingBalance: '',
    pendingDepositedBalance: '',
    totalPendingStakeBalance: '',
    restakedReward: '5.25',
    withdrawTotalAmount: '',
    canClaim: true,
    ...data,
});

const tronStakingData = (data: Partial<StakingPoolExtended>): Partial<StakingPoolExtended> => ({
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

const NOT_STAKED_READING = {
    isActive: false,
    hasStakedForAnalytics: false,
    providers: [],
};

const STAKED_READING = {
    isActive: true,
    hasStakedForAnalytics: true,
};

describe('staking account helpers characterization', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('Ethereum', () => {
        it.each<{ scenario: EthereumStakingScenario; expected: StakingUtilsReading }>([
            { scenario: 'none', expected: { ...NOT_STAKED_READING, stakingData: undefined } },
            {
                scenario: 'pending',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        pendingBalance: '0.5',
                        pendingDepositedBalance: '0.25',
                        totalPendingStakeBalance: '0.75',
                    }),
                },
            },
            {
                scenario: 'pendingDeposited',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        pendingDepositedBalance: '0.25',
                        totalPendingStakeBalance: '0.25',
                    }),
                },
            },
            {
                scenario: 'active',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        depositedBalance: '2',
                        restakedReward: '0.05',
                        autocompoundBalance: '2.05',
                    }),
                },
            },
            {
                scenario: 'unstaking',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        depositedBalance: '1',
                        withdrawTotalAmount: '0.5',
                        restakedReward: '0.02',
                        autocompoundBalance: '1.02',
                    }),
                },
            },
            {
                scenario: 'claimable',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        depositedBalance: '1',
                        withdrawTotalAmount: '0.5',
                        claimableAmount: '0.5',
                        restakedReward: '0.02',
                        autocompoundBalance: '1.02',
                        canClaim: true,
                    }),
                },
            },
            {
                scenario: 'partiallyClaimable',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: everstakePoolData({
                        withdrawTotalAmount: '0.5',
                        claimableAmount: '0.2',
                    }),
                },
            },
            { scenario: 'otherPool', expected: { ...NOT_STAKED_READING, stakingData: undefined } },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readStakingUtils(mockEthereumStakingAccount(scenario))).toEqual(expected);
        });

        it('ignores claim transactions when deciding whether staking is active', () => {
            const account = mockEthereumStakingAccount('partiallyClaimable');

            expect([
                isAccountStakingActive(account, [
                    mockEthereumStakingTransaction({
                        account,
                        stakeType: 'claim',
                        isPending: true,
                    }),
                ]),
                isAccountStakingActive(account, [
                    mockEthereumStakingTransaction({
                        account,
                        stakeType: 'claim',
                        isPending: false,
                    }),
                ]),
            ]).toEqual([true, true]);
        });

        it('Hoodi testnet', () => {
            const account = mockEthereumStakingAccount('active', {
                symbol: asNetworkSymbol('thod'),
            });

            expect(readStakingUtils(account)).toEqual({
                ...STAKED_READING,
                providers: ['everstake'],
                stakingData: everstakePoolData({
                    depositedBalance: '2',
                    restakedReward: '0.05',
                    autocompoundBalance: '2.05',
                }),
            });
        });
    });

    describe('Solana', () => {
        it.each<{ scenario: SolanaStakingScenario; expected: StakingUtilsReading }>([
            {
                scenario: 'none',
                expected: { ...NOT_STAKED_READING, stakingData: solanaStakingData({}) },
            },
            {
                scenario: 'activating',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: solanaStakingData({ totalPendingStakeBalance: '2' }),
                },
            },
            {
                scenario: 'active',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: solanaStakingData({
                        autocompoundBalance: '5',
                        depositedBalance: '5',
                    }),
                },
            },
            {
                scenario: 'deactivating',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: solanaStakingData({ withdrawTotalAmount: '2' }),
                },
            },
            {
                scenario: 'deactivated',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: solanaStakingData({ claimableAmount: '1.5', canClaim: true }),
                },
            },
            {
                scenario: 'mixed',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: solanaStakingData({
                        autocompoundBalance: '4',
                        claimableAmount: '0.5',
                        depositedBalance: '4',
                        totalPendingStakeBalance: '1',
                        withdrawTotalAmount: '2',
                        canClaim: true,
                    }),
                },
            },
            {
                scenario: 'externalOnly',
                expected: {
                    isActive: false,
                    hasStakedForAnalytics: true,
                    providers: ['unknown'],
                    stakingData: solanaStakingData({}),
                },
            },
            {
                scenario: 'everstakeAndExternal',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake', 'unknown'],
                    stakingData: solanaStakingData({
                        autocompoundBalance: '5',
                        depositedBalance: '5',
                    }),
                },
            },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readStakingUtils(mockSolanaStakingAccount(scenario))).toEqual(expected);
        });

        it('devnet', () => {
            const account = mockSolanaStakingAccount('active', { symbol: asNetworkSymbol('dsol') });

            expect(readStakingUtils(account)).toEqual({
                ...STAKED_READING,
                providers: ['everstake'],
                stakingData: solanaStakingData({ autocompoundBalance: '5', depositedBalance: '5' }),
            });
        });
    });

    describe('Cardano', () => {
        it.each<{ scenario: CardanoStakingScenario; expected: StakingUtilsReading }>([
            {
                scenario: 'notDelegated',
                expected: {
                    ...NOT_STAKED_READING,
                    stakingData: cardanoStakingData({
                        autocompoundBalance: '',
                        depositedBalance: '',
                        totalPendingStakeBalance: '1000',
                        restakedReward: '0',
                        canClaim: false,
                    }),
                },
            },
            {
                scenario: 'everstake',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: cardanoStakingData({}),
                },
            },
            {
                scenario: 'everstakeNoRewards',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: cardanoStakingData({
                        depositedBalance: '',
                        totalPendingStakeBalance: '1000',
                        restakedReward: '0',
                        canClaim: false,
                    }),
                },
            },
            {
                scenario: 'everstakeOtherPool',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: cardanoStakingData({ restakedReward: '1' }),
                },
            },
            {
                scenario: 'everstakeMissingDrep',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: cardanoStakingData({}),
                },
            },
            {
                scenario: 'everstakeAbstainDrep',
                expected: {
                    ...STAKED_READING,
                    providers: ['everstake'],
                    stakingData: cardanoStakingData({}),
                },
            },
            {
                scenario: 'fiveBinaries',
                expected: {
                    ...STAKED_READING,
                    providers: ['fivebinaries'],
                    stakingData: cardanoStakingData({ restakedReward: '1' }),
                },
            },
            {
                scenario: 'externalPool',
                expected: {
                    ...STAKED_READING,
                    providers: ['unknown'],
                    stakingData: cardanoStakingData({ restakedReward: '2' }),
                },
            },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readStakingUtils(mockCardanoStakingAccount(scenario))).toEqual(expected);
        });
    });

    describe('Tron', () => {
        it.each<{ scenario: TronStakingScenario; expected: StakingUtilsReading }>([
            {
                scenario: 'none',
                expected: {
                    ...NOT_STAKED_READING,
                    stakingData: tronStakingData({
                        autocompoundBalance: '',
                        depositedBalance: '',
                        restakedReward: '0',
                    }),
                },
            },
            {
                scenario: 'frozenNotVoted',
                expected: {
                    ...STAKED_READING,
                    providers: [],
                    stakingData: tronStakingData({ restakedReward: '0' }),
                },
            },
            {
                scenario: 'votedLuganodes',
                expected: {
                    ...STAKED_READING,
                    providers: ['luganodes'],
                    stakingData: tronStakingData({}),
                },
            },
            {
                scenario: 'votedSplit',
                expected: {
                    ...STAKED_READING,
                    providers: ['luganodes', 'p2p.org'],
                    stakingData: tronStakingData({}),
                },
            },
            {
                scenario: 'votedExternal',
                expected: {
                    ...STAKED_READING,
                    providers: ['unknown'],
                    stakingData: tronStakingData({}),
                },
            },
            {
                scenario: 'unstakingPending',
                expected: {
                    ...STAKED_READING,
                    providers: ['luganodes'],
                    stakingData: tronStakingData({
                        autocompoundBalance: '500',
                        depositedBalance: '500',
                        withdrawTotalAmount: '200',
                    }),
                },
            },
            {
                scenario: 'unstakingWithdrawable',
                expected: {
                    ...STAKED_READING,
                    providers: ['luganodes'],
                    stakingData: tronStakingData({
                        autocompoundBalance: '500',
                        depositedBalance: '500',
                        withdrawTotalAmount: '500',
                    }),
                },
            },
            {
                scenario: 'rewardsOnCooldown',
                expected: {
                    ...STAKED_READING,
                    providers: ['luganodes'],
                    stakingData: tronStakingData({ restakedReward: '2' }),
                },
            },
        ])('$scenario', ({ scenario, expected }) => {
            expect(readStakingUtils(mockTronStakingAccount(scenario))).toEqual(expected);
        });
    });

    it('network without staking', () => {
        expect(readStakingUtils(mockWalletAccount({ symbol: asNetworkSymbol('btc') }))).toEqual({
            ...NOT_STAKED_READING,
            stakingData: undefined,
        });
    });

    it('collects providers across accounts in first-seen order', () => {
        expect(
            getStakingProvidersForAnalytics([
                mockEthereumStakingAccount('active'),
                mockEthereumStakingAccount('otherPool'),
                mockSolanaStakingAccount('everstakeAndExternal'),
                mockCardanoStakingAccount('fiveBinaries'),
                mockCardanoStakingAccount('externalPool'),
                mockTronStakingAccount('votedSplit'),
                mockTronStakingAccount('votedExternal'),
            ]),
        ).toEqual(['everstake', 'unknown', 'fivebinaries', 'luganodes', 'p2p.org']);
    });

    describe('limits', () => {
        const ETHEREUM_LIMITS = {
            MIN_AMOUNT_FOR_STAKING: '0.01',
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: '0.01',
            MAX_AMOUNT_FOR_STAKING: '1000000',
            MIN_FOR_WITHDRAWALS: '0.005',
            MIN_BALANCE_FOR_FEE_BUFFER: '0.005',
            MIN_BALANCE_FOR_STAKING: '0.015',
        };
        const SOLANA_LIMITS = {
            MIN_AMOUNT_FOR_STAKING: '1',
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: '1',
            MAX_AMOUNT_FOR_STAKING: '10000000',
            MIN_FOR_WITHDRAWALS: '0.02',
            MIN_BALANCE_FOR_FEE_BUFFER: '0.005',
            MIN_BALANCE_FOR_STAKING: '1.02',
        };

        it.each([
            { symbol: 'eth', limits: ETHEREUM_LIMITS },
            { symbol: 'thod', limits: ETHEREUM_LIMITS },
            { symbol: 'sol', limits: SOLANA_LIMITS },
            { symbol: 'dsol', limits: SOLANA_LIMITS },
            {
                symbol: 'ada',
                limits: {
                    MIN_AMOUNT_FOR_STAKING: '0',
                    MIN_AMOUNT_FOR_STAKING_DASHBOARD: '2',
                    MAX_AMOUNT_FOR_STAKING: '72000000',
                    MIN_FOR_WITHDRAWALS: '0',
                    MIN_BALANCE_FOR_FEE_BUFFER: '0',
                    MIN_BALANCE_FOR_STAKING: '0',
                },
            },
            {
                symbol: 'trx',
                limits: {
                    MIN_AMOUNT_FOR_STAKING: '1',
                    MIN_AMOUNT_FOR_STAKING_DASHBOARD: '1',
                    MAX_AMOUNT_FOR_STAKING: '1000000000',
                    MIN_FOR_WITHDRAWALS: '0.01',
                    MIN_BALANCE_FOR_FEE_BUFFER: '5',
                    MIN_BALANCE_FOR_STAKING: '1.01',
                },
            },
            { symbol: 'btc', limits: null },
        ])('$symbol staking limits', ({ symbol, limits }) => {
            const stakingLimits = getStakingLimitsByNetworkSymbol(asNetworkSymbol(symbol));

            expect(
                stakingLimits &&
                    Object.fromEntries(
                        Object.entries(stakingLimits).map(([key, value]) => [key, value.toFixed()]),
                    ),
            ).toEqual(limits);
        });

        const BALANCES = ['0', '0.5', '1', '2', '5', '100', '20000000'];

        it.each([
            {
                symbol: 'eth',
                maxAmounts: ['0', '0.495', '0.995', '1.995', '4.995', '99.995', '1000000'],
            },
            {
                symbol: 'thod',
                maxAmounts: ['0', '0.495', '0.995', '1.995', '4.995', '99.995', '1000000'],
            },
            {
                symbol: 'sol',
                maxAmounts: ['0', '0.495', '0.995', '1.98', '4.98', '99.98', '10000000'],
            },
            {
                symbol: 'dsol',
                maxAmounts: ['0', '0.495', '0.995', '1.98', '4.98', '99.98', '10000000'],
            },
            { symbol: 'ada', maxAmounts: ['0', '0.5', '1', '2', '5', '100', '20000000'] },
            { symbol: 'trx', maxAmounts: ['0', '0', '0', '0', '0', '99.99', '19999999.99'] },
            { symbol: 'btc', maxAmounts: ['0', '0', '0', '0', '0', '0', '0'] },
        ])('$symbol max stake amount', ({ symbol, maxAmounts }) => {
            expect(
                BALANCES.map(balance =>
                    getMaxStakeAmount({ balance, symbol: asNetworkSymbol(symbol) }),
                ),
            ).toEqual(maxAmounts);
        });
    });
});
