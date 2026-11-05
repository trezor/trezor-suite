import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS } from './solanaNativeDelegationProductLimits';
import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { ZERO_STAKING_AMOUNT } from '../../../utils/stakingAmounts';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../../unimplementedStakingOperations';

export const getSolanaNativeDelegationProductAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS),
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
