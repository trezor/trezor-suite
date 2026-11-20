import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
    type StakingProductLimits,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { NO_STAKING_AMOUNT_BOUNDS, SMALLEST_STAKING_AMOUNT } from '../../../utils/stakingAmounts';

export type GetEthereumEverstakePooledProductAmountBoundsParams = GetAmountBoundsParams & {
    limits: StakingProductLimits;
};

export const getEthereumEverstakePooledProductAmountBounds = ({
    account,
    position,
    operation,
    limits,
}: GetEthereumEverstakePooledProductAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: limits.minStakeAmount,
                max: getMaxStakeAmount(account.balance, limits),
            };
        case 'unstake':
            return position?.operations.includes('unstake')
                ? { min: SMALLEST_STAKING_AMOUNT, max: position.balances.staked }
                : NO_STAKING_AMOUNT_BOUNDS;
        case 'withdraw':
            return position?.operations.includes('withdraw')
                ? { min: position.balances.withdrawable, max: position.balances.withdrawable }
                : NO_STAKING_AMOUNT_BOUNDS;
        case 'claim':
        case 'vote':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
