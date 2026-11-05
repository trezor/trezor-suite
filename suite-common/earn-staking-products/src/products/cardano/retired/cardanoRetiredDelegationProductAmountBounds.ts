import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { STAKING_OPERATION_NOT_SUPPORTED } from '../../unimplementedStakingOperations';
import { getCardanoStakeKeyAmountBounds } from '../cardanoStakeKeyAmountBounds';

export const getCardanoRetiredDelegationProductAmountBounds = ({
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'unstake':
        case 'claim':
        case 'vote':
            return getCardanoStakeKeyAmountBounds({ position, operation });
        case 'stake':
        case 'withdraw':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
        default:
            return exhaustive(operation);
    }
};
