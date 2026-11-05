import {
    type StakingPosition,
    type StakingPositionTarget,
    type StakingTransaction,
    stakingAmountSchema,
    stakingPositionSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingTransaction } from '@suite-common/earn-staking-common/mocks';
import {
    type EthereumStakingScenario,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledProductDescriptor } from './everstakePooledProductDescriptor';
import { getEverstakePooledProductPosition } from './getEverstakePooledProductPosition';
import { everstakeProvider } from '../../providers/everstake';

const ETHER = '000000000000000000';

type EthereumParsedData = NonNullable<StakingTransaction['ethereumSpecific']>['parsedData'];

const ETH_POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const THOD_POOL_ADDRESS = '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3';

const eth = createEverstakePooledProductDescriptor(asNetworkSymbol('eth'));
const thod = createEverstakePooledProductDescriptor(asNetworkSymbol('thod'));

const amount = (value: string) => stakingAmountSchema.parse(value);

const everstakeTarget = (staked: string): StakingPositionTarget => ({
    address: ETH_POOL_ADDRESS,
    providerId: everstakeProvider.id,
    name: 'Everstake',
    amount: amount(staked),
});

const emptyPosition: StakingPosition = {
    productId: eth.id,
    status: 'inactive',
    lockup: 'locked',
    balances: {
        staked: amount('0'),
        pending: amount('0'),
        unstaking: amount('0'),
        withdrawable: amount('0'),
        rewards: amount('0'),
    },
    unlocks: [],
    targets: [],
    operations: ['stake'],
    pendingTransactions: [],
    warnings: [],
    details: null,
};

const stakingTransaction = (methodId: string, blockHeight: number | undefined) =>
    mockStakingTransaction({
        txid: `${methodId}-${blockHeight ?? 'pending'}`,
        blockHeight,
        ethereumSpecific: {
            status: blockHeight === undefined ? -1 : 1,
            nonce: 6,
            gasLimit: 300_000,
            parsedData: { methodId, name: 'staking' },
        },
    });

const readPosition = (scenario: EthereumStakingScenario) =>
    getEverstakePooledProductPosition({
        productId: eth.id,
        poolAddress: ETH_POOL_ADDRESS,
        account: mockEthereumStakingAccount(scenario),
        productInfo: null,
        transactions: [],
    });

describe('getEverstakePooledProductPosition', () => {
    it.each<{ scenario: EthereumStakingScenario; expected: StakingPosition | null }>([
        { scenario: 'none', expected: null },
        { scenario: 'otherPool', expected: null },
        {
            scenario: 'pending',
            expected: {
                ...emptyPosition,
                status: 'activating',
                balances: { ...emptyPosition.balances, pending: amount(`75${ETHER.slice(2)}`) },
            },
        },
        {
            scenario: 'pendingDeposited',
            expected: {
                ...emptyPosition,
                status: 'activating',
                balances: { ...emptyPosition.balances, pending: amount(`25${ETHER.slice(2)}`) },
            },
        },
        {
            scenario: 'active',
            expected: {
                ...emptyPosition,
                status: 'active',
                balances: {
                    ...emptyPosition.balances,
                    staked: amount(`205${ETHER.slice(2)}`),
                    rewards: amount(`5${ETHER.slice(2)}`),
                },
                targets: [everstakeTarget(`205${ETHER.slice(2)}`)],
                operations: ['stake', 'unstake'],
            },
        },
        {
            scenario: 'unstaking',
            expected: {
                ...emptyPosition,
                status: 'active',
                balances: {
                    ...emptyPosition.balances,
                    staked: amount(`102${ETHER.slice(2)}`),
                    unstaking: amount(`5${ETHER.slice(1)}`),
                    rewards: amount(`2${ETHER.slice(2)}`),
                },
                unlocks: [{ amount: amount(`5${ETHER.slice(1)}`), availableAt: null }],
                targets: [everstakeTarget(`102${ETHER.slice(2)}`)],
                operations: ['stake', 'unstake'],
            },
        },
        {
            scenario: 'claimable',
            expected: {
                ...emptyPosition,
                status: 'active',
                balances: {
                    ...emptyPosition.balances,
                    staked: amount(`102${ETHER.slice(2)}`),
                    withdrawable: amount(`5${ETHER.slice(1)}`),
                    rewards: amount(`2${ETHER.slice(2)}`),
                },
                targets: [everstakeTarget(`102${ETHER.slice(2)}`)],
                operations: ['stake', 'unstake', 'withdraw'],
            },
        },
        {
            scenario: 'partiallyClaimable',
            expected: {
                ...emptyPosition,
                status: 'deactivating',
                balances: {
                    ...emptyPosition.balances,
                    unstaking: amount(`5${ETHER.slice(1)}`),
                },
                unlocks: [{ amount: amount(`5${ETHER.slice(1)}`), availableAt: null }],
            },
        },
    ])('derives the $scenario position', ({ scenario, expected }) => {
        const position = readPosition(scenario);

        expect(position).toEqual(expected);

        if (position !== null) {
            expect(stakingPositionSchema.safeParse(position).success).toBe(true);
        }
    });

    it('derives the Hoodi position under the Hoodi product', () => {
        const position = getEverstakePooledProductPosition({
            productId: thod.id,
            poolAddress: THOD_POOL_ADDRESS,
            account: mockEthereumStakingAccount('active', { symbol: asNetworkSymbol('thod') }),
            productInfo: null,
            transactions: [],
        });

        expect(position).toMatchObject({
            productId: thod.id,
            status: 'active',
            targets: [{ address: THOD_POOL_ADDRESS }],
        });
    });

    it('derives an activating position for a first stake that is still pending', () => {
        const position = getEverstakePooledProductPosition({
            productId: eth.id,
            poolAddress: ETH_POOL_ADDRESS,
            account: mockEthereumStakingAccount('none'),
            productInfo: null,
            transactions: [stakingTransaction('0x3a29dbae', undefined)],
        });

        expect(position).toEqual({
            ...emptyPosition,
            status: 'activating',
            pendingTransactions: [{ txid: '0x3a29dbae-pending', operation: 'stake' }],
        });
        expect(stakingPositionSchema.safeParse(position).success).toBe(true);
    });

    it.each(['1.5', '0x10', '-5', '', 'abc'])(
        'has no position when the pool reports the amount %p',
        claimableAmount => {
            const account = mockEthereumStakingAccount('claimable');
            const [pool] = account.misc.stakingPools ?? [];

            expect(pool).toBeDefined();
            expect(
                getEverstakePooledProductPosition({
                    productId: eth.id,
                    poolAddress: ETH_POOL_ADDRESS,
                    account: {
                        ...account,
                        misc: { ...account.misc, stakingPools: [{ ...pool!, claimableAmount }] },
                    },
                    productInfo: null,
                    transactions: [],
                }),
            ).toBeNull();
        },
    );

    it('has no position without a pool once the first stake is mined', () => {
        expect(
            getEverstakePooledProductPosition({
                productId: eth.id,
                poolAddress: ETH_POOL_ADDRESS,
                account: mockEthereumStakingAccount('none'),
                productInfo: null,
                transactions: [
                    stakingTransaction('0x3a29dbae', 21_000_000),
                    stakingTransaction('0xa9059cbb', undefined),
                ],
            }),
        ).toBeNull();
    });

    it('lists the pending stake, unstake and withdraw transactions and nothing else', () => {
        const position = getEverstakePooledProductPosition({
            productId: eth.id,
            poolAddress: ETH_POOL_ADDRESS,
            account: mockEthereumStakingAccount('active'),
            productInfo: null,
            transactions: [
                stakingTransaction('0x3a29dbae', undefined),
                stakingTransaction('0x76EC871C', 0),
                stakingTransaction('0x33986ffa', undefined),
                stakingTransaction('0x3a29dbae', 21_000_000),
                stakingTransaction('0xa9059cbb', undefined),
                mockStakingTransaction({ txid: 'plain-pending', blockHeight: undefined }),
            ],
        });

        expect(position?.pendingTransactions).toEqual([
            { txid: '0x3a29dbae-pending', operation: 'stake' },
            { txid: '0x76EC871C-0', operation: 'unstake' },
            { txid: '0x33986ffa-pending', operation: 'withdraw' },
        ]);
    });

    it.each([
        { name: 'without a method id', parsedData: { name: 'x' } },
        { name: 'with a null method id', parsedData: { methodId: null, name: 'x' } },
    ])('ignores a pending transaction $name', ({ parsedData }) => {
        const transaction = mockStakingTransaction({
            txid: 'malformed-pending',
            blockHeight: undefined,
            ethereumSpecific: {
                status: -1,
                nonce: 6,
                gasLimit: 300_000,
                parsedData: parsedData as unknown as EthereumParsedData,
            },
        });

        expect(
            getEverstakePooledProductPosition({
                productId: eth.id,
                poolAddress: ETH_POOL_ADDRESS,
                account: mockEthereumStakingAccount('active'),
                productInfo: null,
                transactions: [transaction],
            }),
        ).toMatchObject({ pendingTransactions: [], operations: ['stake', 'unstake'] });
    });

    it('has no position without a pool when only an unstake or withdraw is pending', () => {
        expect(
            getEverstakePooledProductPosition({
                productId: eth.id,
                poolAddress: ETH_POOL_ADDRESS,
                account: mockEthereumStakingAccount('none'),
                productInfo: null,
                transactions: [
                    stakingTransaction('0x76ec871c', undefined),
                    stakingTransaction('0x33986ffa', undefined),
                ],
            }),
        ).toBeNull();
    });

    it.each(['0x3a29dbae', '0x76ec871c', '0x33986ffa'])(
        'withholds unstake while the Everstake transaction %s is pending',
        methodId => {
            const position = getEverstakePooledProductPosition({
                productId: eth.id,
                poolAddress: ETH_POOL_ADDRESS,
                account: mockEthereumStakingAccount('active'),
                productInfo: null,
                transactions: [stakingTransaction(methodId, undefined)],
            });

            expect(position?.operations).toEqual(['stake']);
        },
    );

    it('withholds withdraw only while a withdraw is pending', () => {
        const readOperations = (methodId: string) =>
            getEverstakePooledProductPosition({
                productId: eth.id,
                poolAddress: ETH_POOL_ADDRESS,
                account: mockEthereumStakingAccount('claimable'),
                productInfo: null,
                transactions: [stakingTransaction(methodId, undefined)],
            })?.operations;

        expect(readOperations('0x33986ffa')).toEqual(['stake']);
        expect(readOperations('0x3a29dbae')).toEqual(['stake', 'withdraw']);
    });
});
