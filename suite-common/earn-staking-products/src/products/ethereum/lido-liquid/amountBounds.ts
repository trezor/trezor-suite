import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
    type StakingProductLimits,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { NO_STAKING_AMOUNT_BOUNDS } from '../../../utils/stakingAmounts';

export type GetEthereumLidoLiquidProductAmountBoundsParams = GetAmountBoundsParams & {
    limits: StakingProductLimits;
};

export const getEthereumLidoLiquidProductAmountBounds = ({
    account,
    position,
    operation,
    limits,
}: GetEthereumLidoLiquidProductAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: limits.minStakeAmount,
                max: getMaxStakeAmount(account.balance, limits),
            };
        case 'unstake':
            return position?.operations.includes('unstake')
                ? { min: limits.minWithdrawalAmount, max: position.balances.staked }
                : NO_STAKING_AMOUNT_BOUNDS;
        // The position does not know the withdrawal requests, so it cannot bound their claim.
        case 'withdraw':
            return NO_STAKING_AMOUNT_BOUNDS;
        case 'claim':
        case 'vote':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
