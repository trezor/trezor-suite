import {
    type GetPositionParams,
    type StakingAccount,
    type StakingPositionBalances,
    stakingPositionSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingTransaction,
} from '@suite-common/earn-staking-common/mocks';
import {
    type CardanoStakingScenario,
    MOCK_CARDANO_EVERSTAKE_DREP_ID,
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    MOCK_CARDANO_EXTERNAL_POOL,
    MOCK_CARDANO_FIVE_BINARIES_POOL,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoEverstakeNativeProductDescriptor } from './everstake-native/descriptor';
import { createCardanoExternalNativeProductDescriptor } from './external-native/descriptor';
import { createCardanoFivebinariesRetiredProductDescriptor } from './fivebinaries-retired/descriptor';
import { CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';
import { getCardanoProductPosition } from './position';
import { everstakeProvider } from '../../providers/everstake';
import { externalProvider } from '../../providers/external';
import { fivebinariesProvider } from '../../providers/fivebinaries';

const ADA = '000000';

const networkSymbol = asNetworkSymbol('ada');
const everstakePools = everstakeProvider.identities[networkSymbol] ?? [];
const fiveBinariesPools = fivebinariesProvider.identities[networkSymbol] ?? [];
const managedPools = [...everstakePools, ...fiveBinariesPools];

const everstake = createCardanoEverstakeNativeProductDescriptor({
    networkSymbol,
    provider: everstakeProvider,
    messageSystemFeatures: {},
});
const fiveBinaries = createCardanoFivebinariesRetiredProductDescriptor({
    networkSymbol,
    provider: fivebinariesProvider,
    messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
});
const external = createCardanoExternalNativeProductDescriptor({
    networkSymbol,
    messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
});

type TestPositionParams = Pick<GetPositionParams, 'account'> & Partial<GetPositionParams>;

const getEverstakePosition = (params: TestPositionParams) =>
    getCardanoProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: everstake,
        provider: everstakeProvider,
        ownsPool: poolId => poolId !== null && everstakePools.includes(poolId),
        ownsPendingFirstStake: true,
    });

const getFiveBinariesPosition = (params: TestPositionParams) =>
    getCardanoProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: fiveBinaries,
        provider: fivebinariesProvider,
        ownsPool: poolId => poolId !== null && fiveBinariesPools.includes(poolId),
        ownsPendingFirstStake: false,
    });

const getExternalPosition = (params: TestPositionParams) =>
    getCardanoProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: external,
        provider: externalProvider,
        ownsPool: poolId => poolId === null || !managedPools.includes(poolId),
        ownsPendingFirstStake: false,
    });

const getPositions = (account: StakingAccount) => ({
    everstake: getEverstakePosition({ account }),
    fiveBinaries: getFiveBinariesPosition({ account }),
    external: getExternalPosition({ account }),
});

type ExpectedBalances = Record<keyof StakingPositionBalances, string>;

const balances = (values: Partial<ExpectedBalances>): ExpectedBalances => ({
    staked: '0',
    pending: '0',
    unstaking: '0',
    withdrawable: '0',
    rewards: '0',
    ...values,
});

const registeredWithoutPool = mockStakingAccount({
    symbol: networkSymbol,
    balance: `40${ADA}`,
    misc: {
        staking: {
            address: 'stake1u9ylzsgxaa6xctf4juup682ar3juj85n8tx3hthnljg47zctvm3rc',
            isActive: true,
            rewards: '0',
            poolId: null,
            drep: null,
        },
    },
});

describe('getCardanoProductPosition', () => {
    it('derives the Everstake position of a delegated stake key', () => {
        const position = getEverstakePosition({ account: mockCardanoStakingAccount('everstake') });

        expect(position).toEqual({
            productId: 'ada:ada:everstake:native',
            status: 'active',
            lockup: 'liquid',
            balances: balances({ staked: '994750000', rewards: '5250000' }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_CARDANO_EVERSTAKE_POOL,
                    providerId: 'everstake',
                    name: 'Everstake',
                    amount: '994750000',
                },
            ],
            operations: ['unstake', 'claim', 'vote'],
            pendingTransactions: [],
            warnings: [],
            details: {
                kind: 'cardano-delegation',
                poolId: MOCK_CARDANO_EVERSTAKE_POOL,
                drep: { id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: false },
            },
            revalidateAt: null,
        });
        expect(stakingPositionSchema.safeParse(position).success).toBe(true);
    });

    it('derives no position for a stake key that is not registered', () => {
        expect(getPositions(mockCardanoStakingAccount('notDelegated'))).toEqual({
            everstake: null,
            fiveBinaries: null,
            external: null,
        });
    });

    it.each<{ scenario: CardanoStakingScenario; owner: string }>([
        { scenario: 'everstake', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeNoRewards', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeOtherPool', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeMissingDrep', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeAbstainDrep', owner: 'ada:ada:everstake:native' },
        { scenario: 'fiveBinaries', owner: 'ada:ada:fivebinaries:native' },
        { scenario: 'externalPool', owner: 'ada:ada:external:native' },
    ])('gives the $scenario stake key to $owner only', ({ scenario, owner }) => {
        const positions = Object.values(getPositions(mockCardanoStakingAccount(scenario)));

        expect(
            positions.flatMap(position => (position === null ? [] : [position.productId])),
        ).toEqual([owner]);
    });

    it('attributes an upper-case Everstake pool id to the Everstake product', () => {
        const delegated = mockCardanoStakingAccount('everstake');
        const staking = delegated.misc?.staking;
        const account = {
            ...delegated,
            misc: {
                ...delegated.misc,
                staking: staking && {
                    ...staking,
                    poolId: MOCK_CARDANO_EVERSTAKE_POOL.toUpperCase(),
                },
            },
        };

        expect(getEverstakePosition({ account })?.details).toEqual(
            expect.objectContaining({ poolId: MOCK_CARDANO_EVERSTAKE_POOL }),
        );
        expect(getExternalPosition({ account })).toBeNull();
    });

    it('targets the Everstake pool the stake key is delegated to', () => {
        expect(
            getEverstakePosition({ account: mockCardanoStakingAccount('everstakeOtherPool') }),
        ).toMatchObject({
            balances: balances({ staked: `999${ADA}`, rewards: `1${ADA}` }),
            targets: [{ address: MOCK_CARDANO_EVERSTAKE_OTHER_POOL, providerId: 'everstake' }],
            details: { poolId: MOCK_CARDANO_EVERSTAKE_OTHER_POOL },
        });
    });

    it('offers no claim before the first rewards', () => {
        expect(
            getEverstakePosition({ account: mockCardanoStakingAccount('everstakeNoRewards') }),
        ).toMatchObject({
            balances: balances({ staked: `1000${ADA}` }),
            operations: ['unstake', 'vote'],
            warnings: [],
        });
    });

    it('withholds claim and unstake while a missing DRep blocks withdrawals', () => {
        expect(
            getEverstakePosition({ account: mockCardanoStakingAccount('everstakeMissingDrep') }),
        ).toMatchObject({
            operations: ['vote'],
            warnings: [{ code: 'missing-drep' }],
            details: { drep: null },
        });
    });

    it('keeps a DRep that always abstains', () => {
        expect(
            getEverstakePosition({ account: mockCardanoStakingAccount('everstakeAbstainDrep') }),
        ).toMatchObject({
            operations: ['unstake', 'claim', 'vote'],
            warnings: [],
            details: { drep: { id: 'drep_always_abstain', hasScript: false } },
        });
    });

    it('warns that a retired provider holds the stake', () => {
        const position = getFiveBinariesPosition({
            account: mockCardanoStakingAccount('fiveBinaries'),
        });

        expect(position).toEqual({
            productId: 'ada:ada:fivebinaries:native',
            status: 'active',
            lockup: 'liquid',
            balances: balances({ staked: `999${ADA}`, rewards: `1${ADA}` }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_CARDANO_FIVE_BINARIES_POOL,
                    providerId: 'fivebinaries',
                    name: 'FiveBinaries',
                    amount: `999${ADA}`,
                },
            ],
            operations: ['unstake', 'claim', 'vote'],
            pendingTransactions: [],
            warnings: [{ code: 'outdated-provider', providerId: 'fivebinaries' }],
            details: {
                kind: 'cardano-delegation',
                poolId: MOCK_CARDANO_FIVE_BINARIES_POOL,
                drep: { id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: false },
            },
            revalidateAt: null,
        });
        expect(stakingPositionSchema.safeParse(position).success).toBe(true);
    });

    it('attributes another pool to the external product without a target name', () => {
        expect(
            getExternalPosition({ account: mockCardanoStakingAccount('externalPool') }),
        ).toMatchObject({
            productId: 'ada:ada:external:native',
            balances: balances({ staked: `998${ADA}`, rewards: `2${ADA}` }),
            targets: [
                {
                    address: MOCK_CARDANO_EXTERNAL_POOL,
                    providerId: 'external',
                    amount: `998${ADA}`,
                },
            ],
            operations: ['vote'],
            warnings: [{ code: 'missing-drep' }],
        });
        expect(
            getExternalPosition({ account: mockCardanoStakingAccount('externalPool') })?.targets[0],
        ).not.toHaveProperty('name');
    });

    it('gives a registered stake key without a pool to the external product', () => {
        const positions = getPositions(registeredWithoutPool);

        expect(positions.everstake).toBeNull();
        expect(positions.fiveBinaries).toBeNull();
        expect(positions.external).toMatchObject({
            balances: balances({ staked: `40${ADA}` }),
            targets: [],
            operations: ['unstake', 'vote'],
            details: { kind: 'cardano-delegation', poolId: null, drep: null },
        });
    });

    it('keeps the position of a registered stake key with an empty balance', () => {
        expect(
            getEverstakePosition({
                account: mockCardanoStakingAccount('everstakeNoRewards', { balance: '0' }),
            }),
        ).toMatchObject({
            status: 'inactive',
            balances: balances({}),
            targets: [],
            operations: ['unstake', 'vote'],
        });
    });

    it('derives no position from a malformed balance instead of throwing', () => {
        const account = mockCardanoStakingAccount('everstake', { balance: 'abc' });

        expect(getEverstakePosition({ account })).toBeNull();
        expect(getFiveBinariesPosition({ account })).toBeNull();
        expect(getExternalPosition({ account })).toBeNull();
    });

    it('lists the pending Cardano staking transactions', () => {
        const pendingDelegation = mockStakingTransaction({
            txid: 'pending-delegation',
            blockHeight: undefined,
            cardanoSpecific: { subtype: 'stake_delegation' },
        });
        const pendingSend = mockStakingTransaction({
            txid: 'pending-send',
            blockHeight: undefined,
        });
        const confirmedWithdrawal = mockStakingTransaction({
            txid: 'confirmed-withdrawal',
            cardanoSpecific: { subtype: 'withdrawal' },
        });

        expect(
            getEverstakePosition({
                account: mockCardanoStakingAccount('everstake'),
                transactions: [pendingDelegation, pendingSend, confirmedWithdrawal],
            })?.pendingTransactions,
        ).toEqual([{ txid: 'pending-delegation', operation: 'stake' }]);
    });

    describe('a first stake whose registration is pending', () => {
        const account = mockCardanoStakingAccount('notDelegated');
        const pendingRegistration = mockStakingTransaction({
            txid: 'pending-registration',
            blockHeight: undefined,
            cardanoSpecific: { subtype: 'stake_registration' },
        });

        it('is an activating Everstake position with the balance waiting to be delegated', () => {
            const position = getEverstakePosition({
                account,
                transactions: [pendingRegistration],
            });

            expect(position).toEqual({
                productId: everstake.id,
                status: 'activating',
                lockup: 'liquid',
                balances: balances({ pending: account.balance }),
                unlocks: [],
                targets: [],
                operations: [],
                pendingTransactions: [{ txid: 'pending-registration', operation: 'stake' }],
                warnings: [],
                details: { kind: 'cardano-delegation', poolId: null, drep: null },
                revalidateAt: null,
            });
            expect(stakingPositionSchema.safeParse(position).success).toBe(true);
        });

        it('belongs to no other Cardano product', () => {
            expect(
                getFiveBinariesPosition({ account, transactions: [pendingRegistration] }),
            ).toBeNull();
            expect(
                getExternalPosition({ account, transactions: [pendingRegistration] }),
            ).toBeNull();
        });

        it.each([
            {
                name: 'only a reward withdrawal is pending',
                transaction: mockStakingTransaction({
                    txid: 'pending-withdrawal',
                    blockHeight: undefined,
                    cardanoSpecific: { subtype: 'withdrawal' },
                }),
            },
            {
                name: 'the registration is already mined',
                transaction: mockStakingTransaction({
                    txid: 'mined-registration',
                    cardanoSpecific: { subtype: 'stake_registration' },
                }),
            },
        ])('gives no position when $name', ({ transaction }) => {
            expect(getEverstakePosition({ account, transactions: [transaction] })).toBeNull();
        });
    });

    it.each([
        { subtype: 'stake_registration' as const, operation: 'stake' },
        { subtype: 'stake_delegation' as const, operation: 'stake' },
        { subtype: 'stake_deregistration' as const, operation: 'unstake' },
        { subtype: 'withdrawal' as const, operation: 'claim' },
        { subtype: 'governance_delegation' as const, operation: 'vote' },
    ])(
        'labels a pending $subtype as $operation and withholds unstake and claim',
        ({ subtype, operation }) => {
            const position = getEverstakePosition({
                account: mockCardanoStakingAccount('everstake'),
                transactions: [
                    mockStakingTransaction({
                        txid: `pending-${subtype}`,
                        blockHeight: undefined,
                        cardanoSpecific: { subtype },
                    }),
                ],
            });

            expect(position?.pendingTransactions).toEqual([
                { txid: `pending-${subtype}`, operation },
            ]);
            expect(position?.operations).toEqual(['vote']);
        },
    );
});
