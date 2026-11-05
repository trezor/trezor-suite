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

import { CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES } from './cardanoMessageSystemFeatures';
import { createCardanoExternalDelegationProductDescriptor } from './external/cardanoExternalDelegationProductDescriptor';
import { getCardanoDelegationProductPosition } from './getCardanoDelegationProductPosition';
import { createCardanoNativeDelegationProductDescriptor } from './native/cardanoNativeDelegationProductDescriptor';
import { createCardanoRetiredDelegationProductDescriptor } from './retired/cardanoRetiredDelegationProductDescriptor';
import { everstakeProvider } from '../../providers/everstake';
import { externalProvider } from '../../providers/external';
import { fivebinariesProvider } from '../../providers/fivebinaries';

const ADA = '000000';

const networkSymbol = asNetworkSymbol('ada');
const everstakePools = everstakeProvider.identities[networkSymbol] ?? [];
const fiveBinariesPools = fivebinariesProvider.identities[networkSymbol] ?? [];
const managedPools = [...everstakePools, ...fiveBinariesPools];

const everstake = createCardanoNativeDelegationProductDescriptor({
    networkSymbol,
    provider: everstakeProvider,
    messageSystemFeatures: {},
});
const fiveBinaries = createCardanoRetiredDelegationProductDescriptor({
    networkSymbol,
    provider: fivebinariesProvider,
    messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
});
const external = createCardanoExternalDelegationProductDescriptor({
    networkSymbol,
    messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
});

type TestPositionParams = Pick<GetPositionParams, 'account'> & Partial<GetPositionParams>;

const getEverstakePosition = (params: TestPositionParams) =>
    getCardanoDelegationProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: everstake,
        provider: everstakeProvider,
        ownsPool: poolId => poolId !== null && everstakePools.includes(poolId),
    });

const getFiveBinariesPosition = (params: TestPositionParams) =>
    getCardanoDelegationProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: fiveBinaries,
        provider: fivebinariesProvider,
        ownsPool: poolId => poolId !== null && fiveBinariesPools.includes(poolId),
    });

const getExternalPosition = (params: TestPositionParams) =>
    getCardanoDelegationProductPosition({
        productInfo: null,
        transactions: [],
        ...params,
        descriptor: external,
        provider: externalProvider,
        ownsPool: poolId => poolId === null || !managedPools.includes(poolId),
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

describe('getCardanoDelegationProductPosition', () => {
    it('derives the Everstake position of a delegated stake key', () => {
        const position = getEverstakePosition({ account: mockCardanoStakingAccount('everstake') });

        expect(position).toEqual({
            productId: 'ada:ada:everstake:native',
            status: 'active',
            lockup: 'liquid',
            balances: balances({ staked: `1000${ADA}`, rewards: '5250000' }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_CARDANO_EVERSTAKE_POOL,
                    providerId: 'everstake',
                    name: 'Everstake',
                    amount: `1000${ADA}`,
                },
            ],
            operations: ['unstake', 'claim', 'vote'],
            pendingTxids: [],
            warnings: [],
            details: {
                kind: 'cardano-delegation',
                poolId: MOCK_CARDANO_EVERSTAKE_POOL,
                drep: { id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: false },
            },
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

    it('targets the Everstake pool the stake key is delegated to', () => {
        expect(
            getEverstakePosition({ account: mockCardanoStakingAccount('everstakeOtherPool') }),
        ).toMatchObject({
            balances: balances({ staked: `1000${ADA}`, rewards: `1${ADA}` }),
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
            balances: balances({ staked: `1000${ADA}`, rewards: `1${ADA}` }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_CARDANO_FIVE_BINARIES_POOL,
                    providerId: 'fivebinaries',
                    name: 'FiveBinaries',
                    amount: `1000${ADA}`,
                },
            ],
            operations: ['unstake', 'claim', 'vote'],
            pendingTxids: [],
            warnings: [{ code: 'outdated-provider', providerId: 'fivebinaries' }],
            details: {
                kind: 'cardano-delegation',
                poolId: MOCK_CARDANO_FIVE_BINARIES_POOL,
                drep: { id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: false },
            },
        });
        expect(stakingPositionSchema.safeParse(position).success).toBe(true);
    });

    it('attributes another pool to the external product without a target name', () => {
        expect(
            getExternalPosition({ account: mockCardanoStakingAccount('externalPool') }),
        ).toMatchObject({
            productId: 'ada:ada:external:native',
            balances: balances({ staked: `1000${ADA}`, rewards: `2${ADA}` }),
            targets: [
                {
                    address: MOCK_CARDANO_EXTERNAL_POOL,
                    providerId: 'external',
                    amount: `1000${ADA}`,
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
            })?.pendingTxids,
        ).toEqual(['pending-delegation']);
    });
});
