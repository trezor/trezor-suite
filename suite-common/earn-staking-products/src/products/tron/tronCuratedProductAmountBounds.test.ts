import {
    StakingAdapterError,
    type StakingPosition,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getTronCuratedProductAmountBounds } from './tronCuratedProductAmountBounds';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../unimplementedStakingOperations';

const TRX = '000000';

const account = mockStakingAccount({ symbol: asNetworkSymbol('trx'), balance: `500${TRX}` });

const amount = (value: string) => stakingAmountSchema.parse(value);

const position: StakingPosition = mockStakingPosition({
    balances: {
        staked: amount(`1100${TRX}`),
        pending: amount('0'),
        unstaking: amount(`200${TRX}`),
        withdrawable: amount(`300${TRX}`),
        rewards: amount('1500000'),
    },
    details: {
        kind: 'tron-staking',
        frozen: { energy: amount(`1000${TRX}`), bandwidth: amount(`100${TRX}`) },
        delegated: { energy: amount(`400${TRX}`), bandwidth: amount('0') },
        unallocatedVotingPower: amount('0'),
        rewardClaimAvailableAt: null,
    },
});

describe('getTronCuratedProductAmountBounds', () => {
    // The seven balances and maximums of the P0.1 getMaxStakeAmount snapshot, in sun.
    it.each([
        { balance: '0', max: '0' },
        { balance: '500000', max: '0' },
        { balance: `1${TRX}`, max: '0' },
        { balance: `2${TRX}`, max: '0' },
        { balance: `5${TRX}`, max: '0' },
        { balance: `100${TRX}`, max: '99990000' },
        { balance: `20000000${TRX}`, max: '19999999990000' },
    ])('bounds a stake from a balance of $balance sun', ({ balance, max }) => {
        expect(
            getTronCuratedProductAmountBounds({
                account: mockStakingAccount({ symbol: asNetworkSymbol('trx'), balance }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: `1${TRX}`, max });
    });

    it.each([
        { resource: 'energy', max: `600${TRX}` },
        { resource: 'bandwidth', max: `100${TRX}` },
    ])('unstakes the $resource frozen without the delegated part', ({ resource, max }) => {
        expect(
            getTronCuratedProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: { resource },
            }),
        ).toEqual({ min: '0', max });
    });

    it('unstakes both resources without a resource option', () => {
        expect(
            getTronCuratedProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: {},
            }),
        ).toEqual({ min: '0', max: `700${TRX}` });
    });

    it('unstakes nothing for an unknown resource', () => {
        expect(
            getTronCuratedProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: { resource: 'storage' },
            }),
        ).toEqual({ min: '0', max: '0' });
    });

    it('votes with up to the whole voting power', () => {
        expect(
            getTronCuratedProductAmountBounds({
                account,
                position,
                operation: 'vote',
                options: {},
            }),
        ).toEqual({ min: '0', max: `1100${TRX}` });
    });

    it.each([
        { operation: 'withdraw', amount: `300${TRX}` },
        { operation: 'claim', amount: '1500000' },
    ] as const)('takes the whole amount for a $operation', ({ operation, amount: expected }) => {
        expect(
            getTronCuratedProductAmountBounds({ account, position, operation, options: {} }),
        ).toEqual({ min: expected, max: expected });
    });

    it.each(['unstake', 'vote', 'withdraw', 'claim'] as const)(
        'bounds a %s to zero without a position',
        operation => {
            expect(
                getTronCuratedProductAmountBounds({
                    account,
                    position: null,
                    operation,
                    options: {},
                }),
            ).toEqual({ min: '0', max: '0' });
        },
    );

    it('does not support redelegate', () => {
        expect(() =>
            getTronCuratedProductAmountBounds({
                account,
                position,
                operation: 'redelegate',
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED));
    });
});
