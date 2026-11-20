import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getSolanaEverstakeNativeProductAmountBounds } from './amountBounds';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';

const SOL = '000000000';

const account = mockStakingAccount({ symbol: asNetworkSymbol('sol') });

const limits = SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS;

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`5${SOL}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse(`15${SOL.slice(1)}`),
        rewards: stakingAmountSchema.parse('0'),
    },
    operations: ['stake', 'unstake', 'withdraw'],
});

describe('getSolanaEverstakeNativeProductAmountBounds', () => {
    // The seven balances and maximums of the P0.1 getMaxStakeAmount snapshot, in lamports.
    it.each([
        { balance: '0', max: '0' },
        { balance: `5${SOL.slice(1)}`, max: '495000000' },
        { balance: `1${SOL}`, max: '995000000' },
        { balance: `2${SOL}`, max: '1980000000' },
        { balance: `5${SOL}`, max: '4980000000' },
        { balance: `100${SOL}`, max: '99980000000' },
        { balance: `20000000${SOL}`, max: `10000000${SOL}` },
    ])('bounds a stake from a balance of $balance lamports', ({ balance, max }) => {
        expect(
            getSolanaEverstakeNativeProductAmountBounds({
                account: mockStakingAccount({ symbol: asNetworkSymbol('sol'), balance }),
                position: null,
                operation: 'stake',
                options: {},
                limits,
            }),
        ).toEqual({ min: `1${SOL}`, max });
    });

    it('lets an unstake take anything from one lamport up to the staked balance', () => {
        expect(
            getSolanaEverstakeNativeProductAmountBounds({
                account,
                position,
                operation: 'unstake',
                options: {},
                limits,
            }),
        ).toEqual({ min: '1', max: `5${SOL}` });
    });

    it('withdraws exactly the withdrawable balance', () => {
        expect(
            getSolanaEverstakeNativeProductAmountBounds({
                account,
                position,
                operation: 'withdraw',
                options: {},
                limits,
            }),
        ).toEqual({ min: `15${SOL.slice(1)}`, max: `15${SOL.slice(1)}` });
    });

    it.each(['unstake', 'withdraw'] as const)(
        'has no valid amount to %s without a position',
        operation => {
            expect(
                getSolanaEverstakeNativeProductAmountBounds({
                    account,
                    position: null,
                    operation,
                    options: {},
                    limits,
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );

    it.each(['unstake', 'withdraw'] as const)(
        'has no valid amount to %s while the position does not offer it',
        operation => {
            expect(
                getSolanaEverstakeNativeProductAmountBounds({
                    account,
                    position: { ...position, operations: ['stake'] },
                    operation,
                    options: {},
                    limits,
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );

    it.each(['claim', 'vote', 'redelegate'] as const)('does not support %s', operation => {
        expect(() =>
            getSolanaEverstakeNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
                limits,
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });
});
