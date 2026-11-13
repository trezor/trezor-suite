import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getCardanoFivebinariesNativeProductAmountBounds } from './amountBounds';

const ADA = '000000';

const account = mockStakingAccount({ symbol: asNetworkSymbol('ada'), balance: `1000${ADA}` });

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`1000${ADA}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse('0'),
        rewards: stakingAmountSchema.parse(`1${ADA}`),
    },
    operations: ['unstake', 'claim', 'vote'],
});

describe('getCardanoFivebinariesNativeProductAmountBounds', () => {
    it.each([
        { operation: 'unstake', amount: `1000${ADA}` },
        { operation: 'claim', amount: `1${ADA}` },
        { operation: 'vote', amount: '0' },
    ] as const)('bounds a $operation by the stake key', ({ operation, amount }) => {
        expect(
            getCardanoFivebinariesNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
            }),
        ).toEqual({ min: amount, max: amount });
    });

    it.each(['stake', 'withdraw', 'redelegate'] as const)('does not support %s', operation => {
        expect(() =>
            getCardanoFivebinariesNativeProductAmountBounds({
                account,
                position,
                operation,
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });
});
