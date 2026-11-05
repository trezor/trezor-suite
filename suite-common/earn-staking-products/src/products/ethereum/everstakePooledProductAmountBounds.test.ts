import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';

import { getEverstakePooledProductAmountBounds } from './everstakePooledProductAmountBounds';

const ETHER = '000000000000000000';

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`2${ETHER}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse(`5${ETHER.slice(1)}`),
        rewards: stakingAmountSchema.parse('0'),
    },
    operations: ['stake', 'unstake', 'withdraw'],
});

describe('getEverstakePooledProductAmountBounds', () => {
    // The seven balances and maximums of the P0.1 getMaxStakeAmount snapshot, in wei.
    it.each([
        { balance: '0', max: '0' },
        { balance: `5${ETHER.slice(1)}`, max: '495000000000000000' },
        { balance: `1${ETHER}`, max: '995000000000000000' },
        { balance: `2${ETHER}`, max: '1995000000000000000' },
        { balance: `5${ETHER}`, max: '4995000000000000000' },
        { balance: `100${ETHER}`, max: '99995000000000000000' },
        { balance: `20000000${ETHER}`, max: `1000000${ETHER}` },
    ])('bounds a stake from a balance of $balance wei', ({ balance, max }) => {
        expect(
            getEverstakePooledProductAmountBounds({
                account: mockStakingAccount({ balance }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '10000000000000000', max });
    });

    it('has no valid stake amount when the balance leaves less than the minimum', () => {
        expect(
            getEverstakePooledProductAmountBounds({
                account: mockStakingAccount({ balance: '12000000000000000' }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '10000000000000000', max: '7000000000000000' });
    });

    it('lets an unstake take anything from one wei up to the staked balance', () => {
        expect(
            getEverstakePooledProductAmountBounds({
                account: mockStakingAccount(),
                position,
                operation: 'unstake',
                options: {},
            }),
        ).toEqual({ min: '1', max: `2${ETHER}` });
    });

    it('withdraws exactly the withdrawable balance', () => {
        expect(
            getEverstakePooledProductAmountBounds({
                account: mockStakingAccount(),
                position,
                operation: 'withdraw',
                options: {},
            }),
        ).toEqual({ min: `5${ETHER.slice(1)}`, max: `5${ETHER.slice(1)}` });
    });

    it('has no valid amount to unstake or withdraw without a position', () => {
        const account = mockStakingAccount();

        expect(
            getEverstakePooledProductAmountBounds({
                account,
                position: null,
                operation: 'unstake',
                options: {},
            }),
        ).toEqual({ min: '1', max: '0' });
        expect(
            getEverstakePooledProductAmountBounds({
                account,
                position: null,
                operation: 'withdraw',
                options: {},
            }),
        ).toEqual({ min: '1', max: '0' });
    });

    it.each(['unstake', 'withdraw'] as const)(
        'has no valid amount to %s while the position does not offer it',
        operation => {
            expect(
                getEverstakePooledProductAmountBounds({
                    account: mockStakingAccount(),
                    position: { ...position, operations: ['stake'] },
                    operation,
                    options: {},
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );

    it.each(['claim', 'vote', 'redelegate'] as const)('does not support %s', operation => {
        expect(() =>
            getEverstakePooledProductAmountBounds({
                account: mockStakingAccount(),
                position,
                operation,
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });
});
