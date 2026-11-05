import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';

export type UnimplementedStakingOperations = Pick<
    StakingProductAdapter,
    'planOperation' | 'composeStep' | 'signStep' | 'broadcastStep'
>;

export const createUnimplementedStakingOperations = (): UnimplementedStakingOperations => {
    const reject = () =>
        Promise.reject(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));

    return {
        planOperation: reject,
        composeStep: reject,
        signStep: reject,
        broadcastStep: reject,
    };
};
