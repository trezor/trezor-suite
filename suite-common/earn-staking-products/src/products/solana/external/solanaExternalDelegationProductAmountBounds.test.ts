import {
    STAKING_OPERATIONS,
    StakingAdapterError,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { mockStakingAccount, mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getSolanaExternalDelegationProductAmountBounds } from './solanaExternalDelegationProductAmountBounds';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../../unimplementedStakingOperations';

const SOL = '000000000';

const account = mockStakingAccount({ symbol: asNetworkSymbol('sol') });

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`5${SOL}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse(`15${SOL.slice(1)}`),
        rewards: stakingAmountSchema.parse('0'),
    },
});

describe('getSolanaExternalDelegationProductAmountBounds', () => {
    it.each(STAKING_OPERATIONS)('does not support %s', operation => {
        expect(() =>
            getSolanaExternalDelegationProductAmountBounds({
                account,
                position,
                operation,
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED));
    });
});
