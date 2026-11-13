import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
    type StakingProductLimits,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { getCardanoAmountBounds } from '../amountBounds';

export type GetCardanoEverstakeNativeProductAmountBoundsParams = GetAmountBoundsParams & {
    limits: StakingProductLimits;
};

export const getCardanoEverstakeNativeProductAmountBounds = ({
    account,
    position,
    operation,
    limits,
}: GetCardanoEverstakeNativeProductAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: limits.minStakeAmount,
                max: getMaxStakeAmount(account.balance, limits),
            };
        case 'unstake':
        case 'claim':
        case 'vote':
            return getCardanoAmountBounds({ position, operation });
        case 'withdraw':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
