import { StakingAdapterError, type StakingProductAdapter } from '@suite-common/earn-staking-common';

import { STAKING_OPERATION_NOT_SUPPORTED } from '../../unimplementedStakingOperations';

export const getSolanaExternalDelegationProductAmountBounds: StakingProductAdapter['getAmountBounds'] =
    () => {
        throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
    };
