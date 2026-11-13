import {
    type GetPositionParams,
    type StakingPosition,
    type StakingPositionBalances,
    stakingPositionSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingProductInfo,
    mockStakingTransaction,
} from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_SOLANA_EVERSTAKE_VALIDATOR,
    MOCK_SOLANA_EXTERNAL_VALIDATOR,
    type SolanaStakingScenario,
    mockSolanaStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaEverstakeNativeProductDescriptor } from './everstake-native/descriptor';
import { createSolanaExternalNativeProductDescriptor } from './external-native/descriptor';
import { getSolanaProductPosition } from './position';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from './productInfo';
import { everstakeProvider } from '../../providers/everstake';
import { externalProvider } from '../../providers/external';

const SOL = '000000000';

const everstake = createSolanaEverstakeNativeProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    provider: everstakeProvider,
    messageSystemFeatures: {},
});
const external = createSolanaExternalNativeProductDescriptor(asNetworkSymbol('sol'));

const productInfo = mockStakingProductInfo({ rate: 6.24, targets: [] });

type TestPositionParams = Pick<GetPositionParams, 'account'> & Partial<GetPositionParams>;

const getEverstakePosition = (params: TestPositionParams) =>
    getSolanaProductPosition({
        productInfo,
        transactions: [],
        ...params,
        descriptor: everstake,
        provider: everstakeProvider,
        ownsVoteAccount: voteAccount => voteAccount === MOCK_SOLANA_EVERSTAKE_VALIDATOR,
    });

const getExternalPosition = (params: TestPositionParams) =>
    getSolanaProductPosition({
        productInfo: SOLANA_EXTERNAL_PRODUCT_INFO,
        transactions: [],
        ...params,
        descriptor: external,
        provider: externalProvider,
        ownsVoteAccount: voteAccount => voteAccount !== MOCK_SOLANA_EVERSTAKE_VALIDATOR,
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

const pendingStakeOperation = (txid: string, type: 'stake' | 'unstake' | 'claim') =>
    mockStakingTransaction({
        txid,
        blockHeight: undefined,
        solanaSpecific: { status: 'pending', stakeOperation: { type, amount: `1${SOL}` } },
    });

describe('getSolanaProductPosition', () => {
    it('derives the Everstake position of an active stake', () => {
        expect(getEverstakePosition({ account: mockSolanaStakingAccount('active') })).toEqual({
            productId: 'sol:sol:everstake:native',
            status: 'active',
            lockup: 'locked',
            balances: balances({ staked: `5${SOL}`, rewards: '854795' }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_SOLANA_EVERSTAKE_VALIDATOR,
                    providerId: 'everstake',
                    name: 'Everstake',
                    amount: `5${SOL}`,
                },
            ],
            operations: ['stake', 'unstake'],
            pendingTransactions: [],
            warnings: [],
            details: {
                kind: 'solana-stake-accounts',
                epoch: 800,
                stakeAccounts: [
                    {
                        status: 'active',
                        stake: `5${SOL}`,
                        rentExemptReserve: '2282880',
                        activationEpoch: 790,
                    },
                ],
            },
            revalidateAt: null,
        });
    });

    it('counts inactive stake as unstaking and unlocks it with the deactivating stake', () => {
        const position = getEverstakePosition({ account: mockSolanaStakingAccount('mixed') });

        expect(position).toMatchObject({
            status: 'active',
            balances: balances({
                staked: `4${SOL}`,
                pending: `1${SOL}`,
                unstaking: '2300000000',
                withdrawable: '500000000',
                rewards: '1025753',
            }),
            unlocks: [{ amount: '2300000000', availableAt: null }],
            operations: ['stake', 'unstake', 'withdraw'],
        });
        const stakeAccounts =
            position?.details?.kind === 'solana-stake-accounts'
                ? position.details.stakeAccounts
                : [];

        expect(stakeAccounts.map(({ status }) => status)).toEqual([
            'activating',
            'active',
            'deactivating',
            'deactivated',
            'inactive',
        ]);
    });

    it.each([
        {
            name: 'activates after the epoch the account was read in',
            activationEpoch: 801,
            solEpoch: 800,
            expected: { status: 'activating', balances: balances({ pending: `1${SOL}` }) },
        },
        {
            name: 'was deactivated in the epoch it was delegated',
            activationEpoch: 800,
            solEpoch: 800,
            expected: { status: 'deactivating', balances: balances({ unstaking: `1${SOL}` }) },
        },
        {
            name: 'has no known activation epoch',
            activationEpoch: undefined,
            solEpoch: 800,
            expected: { status: 'deactivating', balances: balances({ unstaking: `1${SOL}` }) },
        },
        {
            name: 'belongs to an account without a known epoch',
            activationEpoch: 801,
            solEpoch: undefined,
            expected: { status: 'deactivating', balances: balances({ unstaking: `1${SOL}` }) },
        },
    ])('places inactive stake that $name', ({ activationEpoch, solEpoch, expected }) => {
        const account = mockStakingAccount({
            symbol: asNetworkSymbol('sol'),
            misc: {
                solStakingAccounts: [
                    {
                        status: 'inactive',
                        stake: `1${SOL}`,
                        rentExemptReserve: '2282880',
                        voterPubkey: MOCK_SOLANA_EVERSTAKE_VALIDATOR,
                        activationEpoch,
                    },
                ],
                solEpoch,
            },
        });

        expect(getEverstakePosition({ account })).toMatchObject({
            ...expected,
            unlocks: expected.status === 'activating' ? [] : [{ amount: `1${SOL}` }],
            operations: ['stake'],
        });
    });

    it.each<{
        scenario: SolanaStakingScenario;
        expected: Pick<StakingPosition, 'status' | 'operations'> & {
            balances: ExpectedBalances;
        };
    }>([
        {
            scenario: 'activating',
            expected: {
                status: 'activating',
                balances: balances({ pending: `2${SOL}` }),
                operations: ['stake'],
            },
        },
        {
            scenario: 'deactivating',
            expected: {
                status: 'deactivating',
                balances: balances({ unstaking: `2${SOL}`, rewards: '341918' }),
                operations: ['stake'],
            },
        },
        {
            scenario: 'deactivated',
            expected: {
                status: 'deactivating',
                balances: balances({ withdrawable: `15${SOL.slice(1)}` }),
                operations: ['stake', 'withdraw'],
            },
        },
    ])('derives the Everstake position of the $scenario scenario', ({ scenario, expected }) => {
        expect(getEverstakePosition({ account: mockSolanaStakingAccount(scenario) })).toMatchObject(
            expected,
        );
    });

    it.each<SolanaStakingScenario>(['none', 'externalOnly'])(
        'has no Everstake position in the %s scenario',
        scenario => {
            expect(
                getEverstakePosition({ account: mockSolanaStakingAccount(scenario) }),
            ).toBeNull();
        },
    );

    it('expects no epoch reward before the product info arrives', () => {
        expect(
            getEverstakePosition({ account: mockSolanaStakingAccount('active'), productInfo: null })
                ?.balances.rewards,
        ).toBe('0');
    });

    it('derives a read-only external position from stake with other validators', () => {
        expect(
            getExternalPosition({
                account: mockSolanaStakingAccount('everstakeAndExternal'),
                transactions: [pendingStakeOperation('pending-stake', 'stake')],
            }),
        ).toEqual({
            productId: 'sol:sol:external:native',
            status: 'active',
            lockup: 'locked',
            balances: balances({ staked: `10${SOL}`, withdrawable: `1${SOL}` }),
            unlocks: [],
            targets: [
                {
                    address: MOCK_SOLANA_EXTERNAL_VALIDATOR,
                    providerId: 'external',
                    amount: `10${SOL}`,
                },
            ],
            operations: [],
            pendingTransactions: [],
            warnings: [],
            details: {
                kind: 'solana-stake-accounts',
                epoch: 800,
                stakeAccounts: [
                    {
                        status: 'active',
                        stake: `10${SOL}`,
                        rentExemptReserve: '2282880',
                        activationEpoch: 790,
                    },
                    {
                        status: 'deactivated',
                        stake: `1${SOL}`,
                        rentExemptReserve: '2282880',
                        activationEpoch: 790,
                    },
                ],
            },
            revalidateAt: null,
        });
    });

    it.each<SolanaStakingScenario>(['none', 'active', 'mixed'])(
        'has no external position in the %s scenario',
        scenario => {
            expect(getExternalPosition({ account: mockSolanaStakingAccount(scenario) })).toBeNull();
        },
    );

    it('assigns stake accounts by vote account, whichever list they arrive in', () => {
        const account = mockStakingAccount({
            symbol: asNetworkSymbol('sol'),
            misc: {
                solStakingAccounts: [
                    {
                        status: 'active',
                        stake: `3${SOL}`,
                        rentExemptReserve: '2282880',
                        voterPubkey: MOCK_SOLANA_EXTERNAL_VALIDATOR,
                    },
                ],
                solExternalStakingAccounts: [
                    {
                        status: 'active',
                        stake: `2${SOL}`,
                        rentExemptReserve: '2282880',
                        voterPubkey: MOCK_SOLANA_EVERSTAKE_VALIDATOR,
                    },
                    { status: 'active', stake: `1${SOL}`, rentExemptReserve: '2282880' },
                ],
                solEpoch: 800,
            },
        });

        expect(getEverstakePosition({ account })?.balances.staked).toBe(`2${SOL}`);
        expect(getExternalPosition({ account })).toMatchObject({
            balances: balances({ staked: `4${SOL}` }),
            targets: [
                {
                    address: MOCK_SOLANA_EXTERNAL_VALIDATOR,
                    providerId: 'external',
                    amount: `3${SOL}`,
                },
            ],
        });
    });

    it('lists the pending Solana stake operations on the Everstake position', () => {
        const transactions = [
            pendingStakeOperation('pending-stake', 'stake'),
            pendingStakeOperation('pending-unstake', 'unstake'),
            pendingStakeOperation('pending-claim', 'claim'),
            mockStakingTransaction({
                txid: 'confirmed-stake',
                solanaSpecific: {
                    status: 'confirmed',
                    stakeOperation: { type: 'stake', amount: `1${SOL}` },
                },
            }),
            mockStakingTransaction({ txid: 'pending-transfer', blockHeight: undefined }),
        ];

        expect(
            getEverstakePosition({ account: mockSolanaStakingAccount('active'), transactions })
                ?.pendingTransactions,
        ).toEqual([
            { txid: 'pending-stake', operation: 'stake' },
            { txid: 'pending-unstake', operation: 'unstake' },
            { txid: 'pending-claim', operation: 'withdraw' },
        ]);
    });

    it.each<SolanaStakingScenario>([
        'activating',
        'active',
        'deactivating',
        'deactivated',
        'mixed',
        'externalOnly',
        'everstakeAndExternal',
    ])('matches the position contract in the %s scenario', scenario => {
        const account = mockSolanaStakingAccount(scenario);

        [getEverstakePosition({ account }), getExternalPosition({ account })].forEach(position => {
            if (position !== null) {
                expect(stakingPositionSchema.safeParse(position).success).toBe(true);
            }
        });
    });
});
