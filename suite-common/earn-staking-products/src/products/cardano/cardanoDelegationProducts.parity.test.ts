import type { AdaPools } from '@suite-common/earn-staking-api';
import {
    type StakingAccount,
    type StakingPosition,
    type StakingProductAdapter,
    type StakingProductInfo,
    assertStakingPosition,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import {
    type CardanoStakingScenario,
    MOCK_CARDANO_EVERSTAKE_DREP_ID,
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    MOCK_CARDANO_EXTERNAL_POOL,
    MOCK_CARDANO_FIVE_BINARIES_POOL,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

import {
    CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
} from './cardanoMessageSystemFeatures';
import { createCardanoExternalDelegationProduct } from './external/createCardanoExternalDelegationProduct';
import {
    type CardanoNativeDelegationProductDeps,
    createCardanoNativeDelegationProduct,
} from './native/createCardanoNativeDelegationProduct';
import { createCardanoRetiredDelegationProduct } from './retired/createCardanoRetiredDelegationProduct';
import { everstakeProvider } from '../../providers/everstake';
import { fivebinariesProvider } from '../../providers/fivebinaries';

// The oracle is the four P0.1 suites that read Cardano: in wallet-core
// src/staking/stakingSelectors.characterization.test.ts,
// src/staking/cardano/cardanoStakingUtils.characterization.test.ts and
// src/staking/shared/stakingUtils.characterization.test.ts, and in wallet-utils
// src/stakingUtils.characterization.test.ts, whose literals are copied here. Products cannot
// import the legacy code, so this file derives the same readings from the three Cardano positions
// and the product info the way P2.5 will, in ADA.
const adaPools: AdaPools = {
    pools: [
        { apy: 2.4, saturation: 80.77, id: MOCK_CARDANO_EVERSTAKE_OTHER_POOL },
        { apy: 2.06, saturation: 62.64, id: MOCK_CARDANO_EVERSTAKE_POOL },
    ],
};

const CARDANO_PRODUCT_KEYS = ['everstake', 'fiveBinaries', 'external'] as const;

type CardanoProductKey = (typeof CARDANO_PRODUCT_KEYS)[number];

const products: Record<CardanoProductKey, StakingProductAdapter> = {
    everstake: createCardanoNativeDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        provider: everstakeProvider,
        messageSystemFeatures: EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
        ...createMockDeps<CardanoNativeDelegationProductDeps>({
            getCardanoPools: () => Promise.resolve(adaPools),
        }),
    }),
    fiveBinaries: createCardanoRetiredDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        provider: fivebinariesProvider,
        messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    }),
    external: createCardanoExternalDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        managedProviders: [everstakeProvider, fivebinariesProvider],
        messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    }),
};

const fromLovelace = (lovelace: string | BigNumber) =>
    new BigNumber(lovelace).shiftedBy(-6).toFixed();

const toLovelace = (ada: string) => new BigNumber(ada).shiftedBy(6).toFixed();

const isPositive = (amount: string) => new BigNumber(amount).gt(0);

type CardanoPositions = Record<CardanoProductKey, StakingPosition | null>;

type CardanoReading = {
    infos: Record<CardanoProductKey, StakingProductInfo>;
    positions: CardanoPositions;
    owner: CardanoProductKey | null;
    position: StakingPosition | null;
};

const readPositions = async (account: StakingAccount): Promise<CardanoReading> => {
    const [everstakeInfo, fiveBinariesInfo, externalInfo] = await Promise.all(
        CARDANO_PRODUCT_KEYS.map(key => products[key].fetchProductInfo({})),
    );

    if (
        everstakeInfo === undefined ||
        fiveBinariesInfo === undefined ||
        externalInfo === undefined
    ) {
        throw new Error('Expected the product info of the three Cardano products');
    }

    const infos = {
        everstake: everstakeInfo,
        fiveBinaries: fiveBinariesInfo,
        external: externalInfo,
    };

    const getPosition = (key: CardanoProductKey) =>
        products[key].getPosition({ account, productInfo: infos[key], transactions: [] });

    const positions: CardanoPositions = {
        everstake: getPosition('everstake'),
        fiveBinaries: getPosition('fiveBinaries'),
        external: getPosition('external'),
    };

    Object.values(positions).forEach(position => {
        if (position !== null) assertStakingPosition(position);
    });

    const owner = CARDANO_PRODUCT_KEYS.find(key => positions[key] !== null) ?? null;

    return { infos, positions, owner, position: owner === null ? null : positions[owner] };
};

const getDelegation = (position: StakingPosition | null) =>
    position?.details?.kind === 'cardano-delegation' ? position.details : null;

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
    reading: CardanoReading;
};

// Cardano stake is liquid and already inside the balance, so nothing is added to it, and the APY
// is the account's Everstake pool, or the promoted one without a pool.
const toLegacyReading = ({
    account,
    reading: { infos, owner, position },
}: ToLegacyReadingParams): LegacyReading => {
    const balances = position?.balances;
    const staked = balances?.staked ?? '0';
    const pending = balances?.pending ?? '0';
    const unstaking = balances?.unstaking ?? '0';
    const withdrawable = balances?.withdrawable ?? '0';
    const lockedAmounts =
        position?.lockup === 'locked' ? [staked, pending, unstaking, withdrawable] : [];
    const poolId = getDelegation(position)?.poolId ?? null;

    return {
        hasStaking: position !== null,
        isStakePending: isPositive(pending),
        isStakeConfirming: (position?.pendingTxids.length ?? 0) > 0,
        apy:
            poolId === null
                ? infos.everstake.rate
                : (infos.everstake.targets.find(({ address }) => address === poolId)?.rate ?? null),
        staked: fromLovelace(staked),
        unstakable: fromLovelace(staked),
        rewards: fromLovelace(balances?.rewards ?? '0'),
        totalStakePending: fromLovelace(pending),
        claimable: fromLovelace(withdrawable),
        canClaim: position?.operations.includes('withdraw') ?? false,
        unstaking: fromLovelace(unstaking),
        unstakingPeriodInDays: infos[owner ?? 'everstake'].exitPeriodDays,
        cryptoBalanceWithStaking: fromLovelace(
            lockedAmounts.reduce((sum, amount) => sum.plus(amount), new BigNumber(account.balance)),
        ),
    };
};

type VotingOption =
    { type: 'abstain' } | { type: 'everstake' } | { type: 'another_drep'; drepId: string };

type LegacyDetailsReading = {
    hasStaked: boolean;
    poolId: string | null;
    isStakedWithEverstake: boolean;
    isStakedOutsideEverstake: boolean;
    isStakedWithFiveBinaries: boolean;
    drepId: string | null;
    votingOption: VotingOption | undefined;
    hasLiveVoteDelegation: boolean;
    isWithdrawalBlockedByMissingDrep: boolean;
    bestPool: string | undefined;
};

const getVotingOption = (drepId: string | null): VotingOption | undefined => {
    if (drepId === null) return undefined;
    if (drepId === 'drep_always_abstain') return { type: 'abstain' };
    if (drepId === MOCK_CARDANO_EVERSTAKE_DREP_ID) return { type: 'everstake' };

    return { type: 'another_drep', drepId };
};

// The fixtures report the DRep in its normalized form, so the id reads the same before and after
// the CIP-129 normalization P2.5 keeps applying.
const toLegacyDetailsReading = ({
    infos,
    positions,
    position,
}: CardanoReading): LegacyDetailsReading => {
    const delegation = getDelegation(position);
    const poolId = delegation?.poolId ?? null;
    const drepId = delegation?.drep?.id ?? null;
    const [leastSaturatedTarget] = infos.everstake.targets.toSorted(
        (a, b) => (a.saturation ?? 0) - (b.saturation ?? 0),
    );

    return {
        hasStaked: position !== null,
        poolId,
        isStakedWithEverstake: positions.everstake !== null,
        isStakedOutsideEverstake:
            positions.fiveBinaries !== null ||
            (getDelegation(positions.external)?.poolId ?? null) !== null,
        isStakedWithFiveBinaries: positions.fiveBinaries !== null,
        drepId,
        votingOption: getVotingOption(drepId),
        hasLiveVoteDelegation: position !== null && drepId !== null,
        isWithdrawalBlockedByMissingDrep:
            position?.warnings.some(({ code }) => code === 'missing-drep') ?? false,
        bestPool:
            positions.everstake !== null ? (poolId ?? undefined) : leastSaturatedTarget?.address,
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

// getStakingDataForNetwork reports the whole balance as pending stake while the rewards are zero,
// which the account balance and the position's rewards reproduce.
const toLegacyUtilsReading = ({
    account,
    reading: { owner, position },
}: ToLegacyReadingParams): LegacyUtilsReading => {
    const rewards = position?.balances.rewards ?? '0';
    const hasRewards = isPositive(rewards);
    const staked = position === null ? '' : fromLovelace(position.balances.staked);
    const hasStakedForAnalytics = position !== null && isPositive(position.balances.staked);
    const hasPool = (getDelegation(position)?.poolId ?? null) !== null;
    const providerId = owner === null ? null : products[owner].descriptor.providerId;

    return {
        stakingData: {
            autocompoundBalance: staked,
            claimableAmount: '',
            depositedBalance: hasRewards ? staked : '',
            pendingBalance: '',
            pendingDepositedBalance: '',
            totalPendingStakeBalance: hasRewards ? '' : fromLovelace(account.balance),
            restakedReward: fromLovelace(rewards),
            withdrawTotalAmount: '',
            canClaim: hasRewards,
        },
        isActive: position !== null,
        hasStakedForAnalytics,
        providers:
            hasStakedForAnalytics && hasPool && providerId !== null
                ? [providerId === 'external' ? 'unknown' : providerId]
                : [],
    };
};

const CARDANO_STAKED_READING: LegacyReading = {
    hasStaking: true,
    isStakePending: false,
    isStakeConfirming: false,
    apy: 2.06,
    staked: '1000',
    unstakable: '1000',
    rewards: '5.25',
    totalStakePending: '0',
    claimable: '0',
    canClaim: false,
    unstaking: '0',
    unstakingPeriodInDays: 5,
    cryptoBalanceWithStaking: '1000',
};

const EVERSTAKE_DETAILS: LegacyDetailsReading = {
    hasStaked: true,
    poolId: MOCK_CARDANO_EVERSTAKE_POOL,
    isStakedWithEverstake: true,
    isStakedOutsideEverstake: false,
    isStakedWithFiveBinaries: false,
    drepId: MOCK_CARDANO_EVERSTAKE_DREP_ID,
    votingOption: { type: 'everstake' },
    hasLiveVoteDelegation: true,
    isWithdrawalBlockedByMissingDrep: false,
    bestPool: MOCK_CARDANO_EVERSTAKE_POOL,
};

const cardanoStakingData = (data: Partial<LegacyStakingData>): LegacyStakingData => ({
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

const stakedUtilsReading = (
    providerId: string,
    data: Partial<LegacyStakingData> = {},
): LegacyUtilsReading => ({
    stakingData: cardanoStakingData(data),
    isActive: true,
    hasStakedForAnalytics: true,
    providers: [providerId],
});

const SCENARIOS: {
    scenario: CardanoStakingScenario;
    expected: LegacyReading;
    expectedDetails: LegacyDetailsReading;
    expectedUtils: LegacyUtilsReading;
}[] = [
    {
        scenario: 'notDelegated',
        expected: {
            ...CARDANO_STAKED_READING,
            hasStaking: false,
            staked: '0',
            unstakable: '0',
            rewards: '0',
        },
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            hasStaked: false,
            poolId: null,
            isStakedWithEverstake: false,
            drepId: null,
            votingOption: undefined,
            hasLiveVoteDelegation: false,
        },
        expectedUtils: {
            stakingData: cardanoStakingData({
                autocompoundBalance: '',
                depositedBalance: '',
                totalPendingStakeBalance: '1000',
                restakedReward: '0',
                canClaim: false,
            }),
            isActive: false,
            hasStakedForAnalytics: false,
            providers: [],
        },
    },
    {
        scenario: 'everstake',
        expected: CARDANO_STAKED_READING,
        expectedDetails: EVERSTAKE_DETAILS,
        expectedUtils: stakedUtilsReading('everstake'),
    },
    {
        scenario: 'everstakeNoRewards',
        expected: { ...CARDANO_STAKED_READING, rewards: '0' },
        expectedDetails: EVERSTAKE_DETAILS,
        expectedUtils: stakedUtilsReading('everstake', {
            depositedBalance: '',
            totalPendingStakeBalance: '1000',
            restakedReward: '0',
            canClaim: false,
        }),
    },
    {
        scenario: 'everstakeOtherPool',
        expected: { ...CARDANO_STAKED_READING, apy: 2.4, rewards: '1' },
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            poolId: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
            bestPool: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
        },
        expectedUtils: stakedUtilsReading('everstake', { restakedReward: '1' }),
    },
    {
        scenario: 'everstakeMissingDrep',
        expected: CARDANO_STAKED_READING,
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            drepId: null,
            votingOption: undefined,
            hasLiveVoteDelegation: false,
            isWithdrawalBlockedByMissingDrep: true,
        },
        expectedUtils: stakedUtilsReading('everstake'),
    },
    {
        scenario: 'everstakeAbstainDrep',
        expected: CARDANO_STAKED_READING,
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            drepId: 'drep_always_abstain',
            votingOption: { type: 'abstain' },
        },
        expectedUtils: stakedUtilsReading('everstake'),
    },
    {
        scenario: 'fiveBinaries',
        expected: { ...CARDANO_STAKED_READING, apy: null, rewards: '1' },
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            poolId: MOCK_CARDANO_FIVE_BINARIES_POOL,
            isStakedWithEverstake: false,
            isStakedOutsideEverstake: true,
            isStakedWithFiveBinaries: true,
        },
        expectedUtils: stakedUtilsReading('fivebinaries', { restakedReward: '1' }),
    },
    {
        scenario: 'externalPool',
        expected: { ...CARDANO_STAKED_READING, apy: null, rewards: '2' },
        expectedDetails: {
            ...EVERSTAKE_DETAILS,
            poolId: MOCK_CARDANO_EXTERNAL_POOL,
            isStakedWithEverstake: false,
            isStakedOutsideEverstake: true,
            drepId: null,
            votingOption: undefined,
            hasLiveVoteDelegation: false,
            isWithdrawalBlockedByMissingDrep: true,
        },
        expectedUtils: stakedUtilsReading('unknown', { restakedReward: '2' }),
    },
];

describe('cardano delegation products parity with the P0.1 snapshots', () => {
    it.each(SCENARIOS)(
        '$scenario',
        async ({ scenario, expected, expectedDetails, expectedUtils }) => {
            const account = mockCardanoStakingAccount(scenario);
            const reading = await readPositions(account);

            expect(toLegacyReading({ account, reading })).toEqual(expected);
            expect(toLegacyDetailsReading(reading)).toEqual(expectedDetails);
            expect(toLegacyUtilsReading({ account, reading })).toEqual(expectedUtils);
        },
    );

    it.each<{ scenario: CardanoStakingScenario; expected: string | null }>([
        { scenario: 'notDelegated', expected: null },
        { scenario: 'everstake', expected: '1000' },
        { scenario: 'everstakeNoRewards', expected: '1000' },
        { scenario: 'fiveBinaries', expected: '1000' },
        { scenario: 'externalPool', expected: '1000' },
    ])('$scenario total staking balance', async ({ scenario, expected }) => {
        const { position } = await readPositions(mockCardanoStakingAccount(scenario));

        expect(position === null ? null : fromLovelace(position.balances.staked)).toBe(expected);
    });

    it('network readings', async () => {
        const staked = await readPositions(mockCardanoStakingAccount('everstake'));
        const notStaked = await readPositions(mockCardanoStakingAccount('notDelegated'));

        expect({
            hasAnyStaked: staked.position !== null,
            hasAnyNotStaked: notStaked.position !== null,
            entryPeriodInDays: staked.infos.everstake.entryPeriodDays ?? undefined,
            apy: staked.infos.everstake.rate,
        }).toEqual({
            hasAnyStaked: true,
            hasAnyNotStaked: false,
            entryPeriodInDays: undefined,
            apy: 2.06,
        });
    });

    it('finds the first account staked with FiveBinaries', async () => {
        const accounts = [
            mockCardanoStakingAccount('everstake'),
            mockCardanoStakingAccount('fiveBinaries'),
        ];
        const readings = await Promise.all(accounts.map(readPositions));

        expect(
            accounts.find(
                (_account, index) => (readings[index]?.positions.fiveBinaries ?? null) !== null,
            ),
        ).toBe(accounts[1]);
    });

    it('ada limits', () => {
        const { limits } = products.everstake.descriptor;

        expect({
            MIN_AMOUNT_FOR_STAKING: fromLovelace(limits.minStakeAmount),
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: fromLovelace(limits.minStakeAmountForDashboard),
            MAX_AMOUNT_FOR_STAKING: fromLovelace(limits.maxStakeAmount),
            MIN_FOR_WITHDRAWALS: fromLovelace(limits.minWithdrawalAmount),
            MIN_BALANCE_FOR_FEE_BUFFER: fromLovelace(limits.feeBufferBalance),
            MIN_BALANCE_FOR_STAKING: fromLovelace(limits.minBalanceForStaking),
        }).toEqual({
            MIN_AMOUNT_FOR_STAKING: '0',
            MIN_AMOUNT_FOR_STAKING_DASHBOARD: '2',
            MAX_AMOUNT_FOR_STAKING: '72000000',
            MIN_FOR_WITHDRAWALS: '0',
            MIN_BALANCE_FOR_FEE_BUFFER: '0',
            MIN_BALANCE_FOR_STAKING: '0',
        });
    });

    it('ada max stake amount', () => {
        const balances = ['0', '0.5', '1', '2', '5', '100', '20000000'];

        expect(
            balances.map(balance =>
                fromLovelace(
                    products.everstake.getAmountBounds({
                        account: mockStakingAccount({
                            symbol: asNetworkSymbol('ada'),
                            balance: toLovelace(balance),
                        }),
                        position: null,
                        operation: 'stake',
                        options: {},
                    }).max,
                ),
            ),
        ).toEqual(['0', '0.5', '1', '2', '5', '100', '20000000']);
    });

    it('shows every Cardano product read-only on mobile, as getMobileStakingSupport does', () => {
        expect(CARDANO_PRODUCT_KEYS.map(key => products[key].descriptor.platforms.mobile)).toEqual([
            { access: 'read-only' },
            { access: 'read-only' },
            { access: 'read-only' },
        ]);
    });
});
