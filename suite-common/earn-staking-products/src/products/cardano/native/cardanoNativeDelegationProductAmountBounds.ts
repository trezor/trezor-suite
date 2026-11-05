import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS } from './cardanoNativeDelegationProductLimits';
import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../../unimplementedStakingOperations';
import { getCardanoStakeKeyAmountBounds } from '../cardanoStakeKeyAmountBounds';

export const getCardanoNativeDelegationProductAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS),
            };
        case 'unstake':
        case 'claim':
        case 'vote':
            return getCardanoStakeKeyAmountBounds({ position, operation });
        case 'withdraw':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
        default:
            return exhaustive(operation);
    }
};
