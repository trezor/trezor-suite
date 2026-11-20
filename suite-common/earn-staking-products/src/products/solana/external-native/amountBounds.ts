import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';

export const getSolanaExternalNativeProductAmountBounds: StakingProductAdapter['getAmountBounds'] =
    () => {
        throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
    };
