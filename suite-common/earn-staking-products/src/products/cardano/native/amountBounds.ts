import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS } from './limits';
import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { getCardanoStakeKeyAmountBounds } from '../amountBounds';

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
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
