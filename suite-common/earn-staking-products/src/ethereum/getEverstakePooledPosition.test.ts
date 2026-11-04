import {
    type StakingPosition,
    type StakingPositionTarget,
    stakingAmountSchema,
    stakingPositionSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingTransaction } from '@suite-common/earn-staking-common/mocks';
import {
    type EthereumStakingScenario,
    MOCK_ETHEREUM_EVERSTAKE_CONTRACT,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledDescriptor } from './everstakePooledDescriptor';
import { getEverstakePooledPosition } from './getEverstakePooledPosition';
import { everstakeProvider } from '../providers/everstake';

const ETHER = '000000000000000000';

const eth = createEverstakePooledDescriptor(asNetworkSymbol('eth'));
const thod = createEverstakePooledDescriptor(asNetworkSymbol('thod'));

const amount = (value: string) => stakingAmountSchema.parse(value);

const everstakeTarget = (staked: string): StakingPositionTarget => ({
    address: MOCK_ETHEREUM_EVERSTAKE_CONTRACT,
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
    pendingTxids: [],
    warnings: [],
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
    getEverstakePooledPosition({
        productId: eth.id,
        account: mockEthereumStakingAccount(scenario),
        productInfo: null,
        transactions: [],
    });

describe('getEverstakePooledPosition', () => {
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
                    unstaking: amount(`3${ETHER.slice(1)}`),
                    withdrawable: amount(`2${ETHER.slice(1)}`),
                },
                unlocks: [{ amount: amount(`3${ETHER.slice(1)}`), availableAt: null }],
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
        const position = getEverstakePooledPosition({
            productId: thod.id,
            account: mockEthereumStakingAccount('active', { symbol: asNetworkSymbol('thod') }),
            productInfo: null,
            transactions: [],
        });

        expect(position).toMatchObject({ productId: thod.id, status: 'active' });
    });

    it('lists the pending stake, unstake and withdraw transactions and nothing else', () => {
        const position = getEverstakePooledPosition({
            productId: eth.id,
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

        expect(position?.pendingTxids).toEqual([
            '0x3a29dbae-pending',
            '0x76EC871C-0',
            '0x33986ffa-pending',
        ]);
    });
});
