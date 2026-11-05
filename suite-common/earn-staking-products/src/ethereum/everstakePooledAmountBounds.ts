import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { EVERSTAKE_POOLED_LIMITS } from './everstakePooledDescriptor';
import { getMaxStakeAmount } from '../shared/getMaxStakeAmount';
import { ZERO_STAKING_AMOUNT } from '../shared/stakingAmounts';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../shared/unimplementedStakingOperations';

export const getEverstakePooledAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: EVERSTAKE_POOLED_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, EVERSTAKE_POOLED_LIMITS),
            };
        case 'unstake':
            return {
                min: ZERO_STAKING_AMOUNT,
                max: position?.balances.staked ?? ZERO_STAKING_AMOUNT,
            };
        case 'withdraw': {
            const withdrawable = position?.balances.withdrawable ?? ZERO_STAKING_AMOUNT;

            return { min: withdrawable, max: withdrawable };
        }
        case 'claim':
        case 'vote':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
        default:
            return exhaustive(operation);
    }
};
