import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { getCardanoAmountBounds } from '../amountBounds';
import { CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';

export const getCardanoEverstakeNativeProductAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS),
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
