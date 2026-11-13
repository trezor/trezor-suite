import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingPosition,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getTronNativeProductAmountBounds } from './amountBounds';
import { TRON_NATIVE_PRODUCT_LIMITS } from './limits';

const TRX = '000000';

const limits = TRON_NATIVE_PRODUCT_LIMITS;

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
        frozen: { energy: amount(`600${TRX}`), bandwidth: amount(`100${TRX}`) },
        delegated: { energy: amount(`400${TRX}`), bandwidth: amount('0') },
        votingPower: amount(`1100${TRX}`),
        unallocatedVotingPower: amount('0'),
        rewardClaimAvailableAt: null,
    },
    operations: ['stake', 'unstake', 'vote', 'withdraw', 'claim'],
});

describe('getTronNativeProductAmountBounds', () => {
    it.each([
        { balance: '0', max: '0' },
        { balance: '500000', max: '0' },
        { balance: `1${TRX}`, max: '500000' },
        { balance: `2${TRX}`, max: '1500000' },
        { balance: `5${TRX}`, max: '4500000' },
        { balance: `100${TRX}`, max: '99500000' },
        { balance: `2000000000${TRX}`, max: `1000000000${TRX}` },
    ])('keeps 0.5 TRX of an available balance of $balance sun', ({ balance, max }) => {
        expect(
            getTronNativeProductAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('trx'),
                    balance,
                    availableBalance: balance,
                }),
                position: null,
                operation: 'stake',
                options: {},
                limits,
            }),
        ).toEqual({ min: `1${TRX}`, max });
    });

    it('stakes from the available balance', () => {
        expect(
            getTronNativeProductAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('trx'),
                    balance: `100${TRX}`,
                    availableBalance: `50${TRX}`,
                }),
                position: null,
                operation: 'stake',
                options: {},
                limits,
            }).max,
        ).toBe('49500000');
    });

    it.each([
        { resource: 'energy', max: `600${TRX}` },
        { resource: 'bandwidth', max: `100${TRX}` },
    ])('unstakes the $resource frozen in the account, not the delegated', ({ resource, max }) => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: { resource },
                limits,
            }),
        ).toEqual({ min: '1', max });
    });

    it('unstakes both resources without a resource option', () => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: {},
                limits,
            }),
        ).toEqual({ min: '1', max: `700${TRX}` });
    });

    it('unstakes nothing for an unknown resource', () => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: { resource: 'storage' },
                limits,
            }),
        ).toEqual({ min: '1', max: '0' });
    });

    it('votes with up to the whole voting power', () => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position,
                operation: 'vote',
                options: {},
                limits,
            }),
        ).toEqual({ min: '0', max: `1100${TRX}` });
    });

    it('votes with the voting power, not the staked amount', () => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position: {
                    ...position,
                    balances: { ...position.balances, staked: amount('1100500000') },
                },
                operation: 'vote',
                options: {},
                limits,
            }),
        ).toEqual({ min: '0', max: `1100${TRX}` });
    });

    it.each([
        { operation: 'withdraw', amount: `300${TRX}` },
        { operation: 'claim', amount: '1500000' },
    ] as const)('takes the whole amount for a $operation', ({ operation, amount: expected }) => {
        expect(
            getTronNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
                limits,
            }),
        ).toEqual({ min: expected, max: expected });
    });

    it.each(['unstake', 'vote', 'withdraw', 'claim'] as const)(
        'has no valid amount to %s without a position',
        operation => {
            expect(
                getTronNativeProductAmountBounds({
                    account,
                    position: null,
                    operation,
                    options: {},
                    limits,
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );

    it.each(['unstake', 'vote', 'withdraw', 'claim'] as const)(
        'has no valid amount to %s while the position does not offer it',
        operation => {
            expect(
                getTronNativeProductAmountBounds({
                    account,
                    position: { ...position, operations: ['stake'] },
                    operation,
                    options: {},
                    limits,
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );

    it('does not support redelegate', () => {
        expect(() =>
            getTronNativeProductAmountBounds({
                account,
                position,
                operation: 'redelegate',
                options: {},
                limits,
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });
});
