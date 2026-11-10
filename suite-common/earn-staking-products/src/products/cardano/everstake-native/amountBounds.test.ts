import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getCardanoEverstakeNativeProductAmountBounds } from './amountBounds';

const ADA = '000000';

const account = mockStakingAccount({ symbol: asNetworkSymbol('ada'), balance: `1000${ADA}` });

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`1000${ADA}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse('0'),
        rewards: stakingAmountSchema.parse('5250000'),
    },
    operations: ['unstake', 'claim', 'vote'],
});

describe('getCardanoEverstakeNativeProductAmountBounds', () => {
    // The seven balances and maximums of the P0.1 getMaxStakeAmount snapshot, in lovelace.
    it.each([
        { balance: '0', max: '0' },
        { balance: '500000', max: '500000' },
        { balance: `1${ADA}`, max: `1${ADA}` },
        { balance: `2${ADA}`, max: `2${ADA}` },
        { balance: `5${ADA}`, max: `5${ADA}` },
        { balance: `100${ADA}`, max: `100${ADA}` },
        { balance: `20000000${ADA}`, max: `20000000${ADA}` },
    ])('bounds a stake from a balance of $balance lovelace', ({ balance, max }) => {
        expect(
            getCardanoEverstakeNativeProductAmountBounds({
                account: mockStakingAccount({ symbol: asNetworkSymbol('ada'), balance }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '0', max });
    });

    it('caps a stake at the product maximum', () => {
        expect(
            getCardanoEverstakeNativeProductAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('ada'),
                    balance: `80000000${ADA}`,
                }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '0', max: `72000000${ADA}` });
    });

    it.each([
        { operation: 'unstake', amount: `1000${ADA}` },
        { operation: 'claim', amount: '5250000' },
        { operation: 'vote', amount: '0' },
    ] as const)('bounds a $operation by the stake key', ({ operation, amount }) => {
        expect(
            getCardanoEverstakeNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
            }),
        ).toEqual({ min: amount, max: amount });
    });

    it.each(['withdraw', 'redelegate'] as const)('does not support %s', operation => {
        expect(() =>
            getCardanoEverstakeNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });
});
