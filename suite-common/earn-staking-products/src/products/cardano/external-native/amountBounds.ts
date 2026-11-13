import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getCardanoAmountBounds } from '../amountBounds';

export const getCardanoExternalNativeProductAmountBounds = ({
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'unstake':
        case 'claim':
        case 'vote':
            return getCardanoAmountBounds({ position, operation });
        case 'stake':
        case 'withdraw':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
