import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import {
    type StakingAccount,
    type StakingPosition,
    type StakingProductAdapter,
    type StakingProductInfo,
    type StakingTransaction,
    assertStakingPosition,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingTransaction,
} from '@suite-common/earn-staking-common/mocks';
import {
    type SolanaStakingScenario,
    mockSolanaStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import { type CreateSolanaProductsDeps, createSolanaProducts } from './createSolanaProducts';

// The oracle is the P0.1 characterization suites in wallet-core
// (src/staking/stakingSelectors.characterization.test.ts,
// src/staking/solana/solanaStakingUtils.characterization.test.ts and the limits and maximum stake
// amounts in src/staking/shared/stakingUtils.characterization.test.ts), whose literals are copied
// here. Products cannot import the legacy selectors, so this file derives the same readings from
// the Everstake and the external position and the product info the way P2.5 will, in SOL.
const stats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

type SolanaProducts = {
    everstake: StakingProductAdapter;
    external: StakingProductAdapter;
};

const createProducts = (symbol: string): SolanaProducts => {
    const [everstake, external] = createSolanaProducts({
        networkSymbol: asNetworkSymbol(symbol),
        ...createMockDeps<CreateSolanaProductsDeps>({
            getStakingStats: () => Promise.resolve(stats),
        }),
    });

    if (everstake === undefined || external === undefined) {
        throw new Error(`Expected the Everstake and the external ${symbol} product`);
    }

    return { everstake, external };
};

const fromLamports = (lamports: string | BigNumber) =>
    new BigNumber(lamports).shiftedBy(-9).toFixed();

const toLamports = (sol: string) => new BigNumber(sol).shiftedBy(9).toFixed();

const sum = (...amounts: string[]) =>
    amounts.reduce((total, amount) => total.plus(amount), new BigNumber(0));

type SolanaPositions = {
    everstake: StakingPosition | null;
    external: StakingPosition | null;
};

type ReadPositionsParams = {
    products: SolanaProducts;
    account: StakingAccount;
    transactions?: readonly StakingTransaction[];
};

const readPositions = async ({ products, account, transactions = [] }: ReadPositionsParams) => {
    const [everstakeInfo, externalInfo] = await Promise.all([
        products.everstake.fetchProductInfo({}),
        products.external.fetchProductInfo({}),
    ]);
    const positions: SolanaPositions = {
        everstake: products.everstake.getPosition({
            account,
            productInfo: everstakeInfo,
            transactions,
        }),
        external: products.external.getPosition({
            account,
            productInfo: externalInfo,
            transactions,
        }),
    };

    [positions.everstake, positions.external].forEach(position => {
        if (position !== null) assertStakingPosition(position);
    });

    return { positions, productInfo: everstakeInfo };
};

const getStakeAccounts = (position: StakingPosition | null) =>
    position?.details?.kind === 'solana-stake-accounts' ? position.details.stakeAccounts : [];

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
    entryPeriodInDays: number | null;
};

type ToLegacyReadingParams = {
    account: StakingAccount;
    positions: SolanaPositions;
    productInfo: StakingProductInfo;
};

// The legacy Solana readings count Everstake stake only; the external position feeds the banner.
const toLegacyReading = ({
    account,
    positions: { everstake },
    productInfo,
}: ToLegacyReadingParams): LegacyReading => {
    const balances = everstake?.balances;
    const staked = balances?.staked ?? '0';
    const pending = balances?.pending ?? '0';
    const unstaking = balances?.unstaking ?? '0';
    const withdrawable = balances?.withdrawable ?? '0';
    const rewards = balances?.rewards ?? '0';

    return {
        hasStaking: everstake !== null,
        isStakePending: new BigNumber(pending).gt(0),
        isStakeConfirming: (everstake?.pendingTxids.length ?? 0) > 0,
        apy: productInfo.rate,
        staked: fromLamports(staked),
        unstakable: fromLamports(staked),
        rewards: new BigNumber(rewards).shiftedBy(-9).toFixed(9),
        totalStakePending: fromLamports(pending),
        claimable: fromLamports(withdrawable),
        canClaim: everstake?.operations.includes('withdraw') ?? false,
        unstaking: fromLamports(unstaking),
        unstakingPeriodInDays: productInfo.exitPeriodDays,
        cryptoBalanceWithStaking: fromLamports(
            sum(account.balance, staked, pending, unstaking, withdrawable),
        ),
        entryPeriodInDays: productInfo.entryPeriodDays,
    };
};

type LegacyDetailsReading = {
    hasStaked: boolean;
    hasExternalStakingAccounts: boolean;
    externalStakingAccountsTotalStaked: string;
    currentStatus: 'inactive' | 'activating' | null;
    deactivatedAccountCount: number;
    activeStakes: string[];
};

// The legacy helpers read the stake accounts themselves; getSolanaUnstakeAmountBounds moves onto
// the details as it is, so its input, the active stakes, is what this suite pins.
const toLegacyDetailsReading = ({ everstake, external }: SolanaPositions): LegacyDetailsReading => {
    const everstakeStakeAccounts = getStakeAccounts(everstake);
    const statuses = everstakeStakeAccounts.map(({ status }) => status);
    const externalBalances = external?.balances;

    return {
        hasStaked: everstake !== null,
        hasExternalStakingAccounts: external !== null,
        externalStakingAccountsTotalStaked: sum(
            externalBalances?.staked ?? '0',
            externalBalances?.pending ?? '0',
            externalBalances?.unstaking ?? '0',
            externalBalances?.withdrawable ?? '0',
        ).toFixed(),
        currentStatus:
            (['inactive', 'activating'] as const).find(status => statuses.includes(status)) ?? null,
        deactivatedAccountCount: statuses.filter(status => status === 'deactivated').length,
        activeStakes: everstakeStakeAccounts
            .filter(({ status }) => status === 'active')
            .map(({ stake }) => stake),
    };
};

const SOLANA_EMPTY_READING: LegacyReading = {
    hasStaking: false,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 6.24,
    staked: '0',
    unstakable: '0',
    rewards: '0.000000000',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 1,
    cryptoBalanceWithStaking: '2.5',
    entryPeriodInDays: 1,
};

const SOLANA_ACTIVE_READING: LegacyReading = {
    ...SOLANA_EMPTY_READING,
    hasStaking: true,
    staked: '5',
    unstakable: '5',
    rewards: '0.000854795',
    cryptoBalanceWithStaking: '7.5',
};

const NOT_STAKED_DETAILS: LegacyDetailsReading = {
    hasStaked: false,
    hasExternalStakingAccounts: false,
    externalStakingAccountsTotalStaked: '0',
    currentStatus: null,
    deactivatedAccountCount: 0,
    activeStakes: [],
};

const ACTIVE_DETAILS: LegacyDetailsReading = {
    ...NOT_STAKED_DETAILS,
    hasStaked: true,
    activeStakes: ['5000000000'],
};

const SCENARIOS: {
    scenario: SolanaStakingScenario;
    expected: LegacyReading;
    expectedDetails: LegacyDetailsReading;
}[] = [
    { scenario: 'none', expected: SOLANA_EMPTY_READING, expectedDetails: NOT_STAKED_DETAILS },
    {
        scenario: 'activating',
        expected: {
            ...SOLANA_EMPTY_READING,
            hasStaking: true,
            isStakePending: true,
            totalStakePending: '2',
            cryptoBalanceWithStaking: '4.5',
        },
        expectedDetails: { ...NOT_STAKED_DETAILS, hasStaked: true, currentStatus: 'activating' },
    },
    { scenario: 'active', expected: SOLANA_ACTIVE_READING, expectedDetails: ACTIVE_DETAILS },
    {
        scenario: 'deactivating',
        expected: {
            ...SOLANA_EMPTY_READING,
            hasStaking: true,
            rewards: '0.000341918',
            unstaking: '2',
            cryptoBalanceWithStaking: '4.5',
        },
        expectedDetails: { ...NOT_STAKED_DETAILS, hasStaked: true },
    },
    {
        scenario: 'deactivated',
        expected: {
            ...SOLANA_EMPTY_READING,
            hasStaking: true,
            claimable: '1.5',
            canClaim: true,
            cryptoBalanceWithStaking: '4',
        },
        expectedDetails: { ...NOT_STAKED_DETAILS, hasStaked: true, deactivatedAccountCount: 1 },
    },
    {
        scenario: 'mixed',
        expected: {
            ...SOLANA_EMPTY_READING,
            hasStaking: true,
            isStakePending: true,
            staked: '4',
            unstakable: '4',
            rewards: '0.001025753',
            totalStakePending: '1',
            claimable: '0.5',
            canClaim: true,
            // The legacy reading is 2: it counts the 0.3 SOL of inactive stake in the balance
            // with staking but in no bucket. The position counts it as unstaking (decision 5),
            // which is the one deliberate difference on mainnet.
            unstaking: '2.3',
            cryptoBalanceWithStaking: '10.3',
        },
        expectedDetails: {
            ...NOT_STAKED_DETAILS,
            hasStaked: true,
            currentStatus: 'inactive',
            deactivatedAccountCount: 1,
            activeStakes: ['4000000000'],
        },
    },
    {
        scenario: 'externalOnly',
        expected: SOLANA_EMPTY_READING,
        expectedDetails: {
            ...NOT_STAKED_DETAILS,
            hasExternalStakingAccounts: true,
            externalStakingAccountsTotalStaked: '10000000000',
        },
    },
    {
        scenario: 'everstakeAndExternal',
        expected: SOLANA_ACTIVE_READING,
        expectedDetails: {
            ...ACTIVE_DETAILS,
            hasExternalStakingAccounts: true,
            externalStakingAccountsTotalStaked: '11000000000',
        },
    },
];

const pendingStakeTransaction = (): StakingTransaction =>
    mockStakingTransaction({
        txid: 'pending-stake',
        blockHeight: undefined,
        solanaSpecific: {
            status: 'pending',
            stakeOperation: { type: 'stake', amount: '1000000000' },
        },
    });

describe('solana delegation products parity with the P0.1 snapshots', () => {
    const sol = createProducts('sol');

    it.each(SCENARIOS)('$scenario', async ({ scenario, expected, expectedDetails }) => {
        const account = mockSolanaStakingAccount(scenario);
        const { positions, productInfo } = await readPositions({ products: sol, account });

        expect(toLegacyReading({ account, positions, productInfo })).toEqual(expected);
        expect(toLegacyDetailsReading(positions)).toEqual(expectedDetails);
    });

    it.each(SCENARIOS)(
        'assigns every stake account of the $scenario scenario to exactly one product',
        async ({ scenario }) => {
            const account = mockSolanaStakingAccount(scenario);
            const { positions } = await readPositions({ products: sol, account });
            const { solStakingAccounts = [], solExternalStakingAccounts = [] } = account.misc ?? {};

            expect(getStakeAccounts(positions.everstake)).toEqual(
                solStakingAccounts.map(({ status, stake, activationEpoch }) => ({
                    status,
                    stake,
                    activationEpoch,
                })),
            );
            expect(getStakeAccounts(positions.external)).toEqual(
                solExternalStakingAccounts.map(({ status, stake, activationEpoch }) => ({
                    status,
                    stake,
                    activationEpoch,
                })),
            );
        },
    );

    it('confirming stake transaction', async () => {
        const account = mockSolanaStakingAccount('active');
        const { positions, productInfo } = await readPositions({
            products: sol,
            account,
            transactions: [pendingStakeTransaction()],
        });

        expect(toLegacyReading({ account, positions, productInfo })).toEqual({
            ...SOLANA_ACTIVE_READING,
            isStakeConfirming: true,
        });
    });

    it('confirmed stake transaction', async () => {
        const pending = pendingStakeTransaction();
        const confirmed: StakingTransaction = {
            ...pending,
            solanaSpecific: { status: 'confirmed', stakeOperation: { type: 'stake', amount: '1' } },
        };
        const account = mockSolanaStakingAccount('active');
        const { positions, productInfo } = await readPositions({
            products: sol,
            account,
            transactions: [confirmed],
        });

        expect(toLegacyReading({ account, positions, productInfo })).toEqual(SOLANA_ACTIVE_READING);
    });

    // The legacy selectors leave the devnet APY null through a missing switch case and so expect
    // no epoch reward; the product reads the mainnet stats for both networks (decision 4), so the
    // APY of 6.24 and the reward of 0.000854795 are the deliberate differences from the snapshot.
    it('devnet', async () => {
        const account = mockSolanaStakingAccount('active', { symbol: asNetworkSymbol('dsol') });
        const { positions, productInfo } = await readPositions({
            products: createProducts('dsol'),
            account,
        });

        expect(toLegacyReading({ account, positions, productInfo })).toEqual(SOLANA_ACTIVE_READING);
        expect(toLegacyDetailsReading(positions)).toEqual(ACTIVE_DETAILS);
    });

    it.each(['sol', 'dsol'])('%s limits', symbol => {
        const { limits } = createProducts(symbol).everstake.descriptor;

        expect({
            MIN_AMOUNT_FOR_STAKING: fromLamports(limits.minStakeAmount),
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: fromLamports(limits.minStakeAmountForDashboard),
            MAX_AMOUNT_FOR_STAKING: fromLamports(limits.maxStakeAmount),
            MIN_FOR_WITHDRAWALS: fromLamports(limits.minWithdrawalAmount),
            MIN_BALANCE_FOR_FEE_BUFFER: fromLamports(limits.feeBufferBalance),
            MIN_BALANCE_FOR_STAKING: fromLamports(limits.minBalanceForStaking),
        }).toEqual({
            MIN_AMOUNT_FOR_STAKING: '1',
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: '1',
            MAX_AMOUNT_FOR_STAKING: '10000000',
            MIN_FOR_WITHDRAWALS: '0.02',
            MIN_BALANCE_FOR_FEE_BUFFER: '0.005',
            MIN_BALANCE_FOR_STAKING: '1.02',
        });
    });

    it.each(['sol', 'dsol'])('%s max stake amount', symbol => {
        const { everstake } = createProducts(symbol);
        const balances = ['0', '0.5', '1', '2', '5', '100', '20000000'];

        expect(
            balances.map(balance =>
                fromLamports(
                    everstake.getAmountBounds({
                        account: mockStakingAccount({
                            symbol: asNetworkSymbol(symbol),
                            balance: toLamports(balance),
                        }),
                        position: null,
                        operation: 'stake',
                        options: {},
                    }).max,
                ),
            ),
        ).toEqual(['0', '0.495', '0.995', '1.98', '4.98', '99.98', '10000000']);
    });
});
