import { StakingAdapterError, type StakingProductAdapter } from '@suite-common/earn-staking-common';

export const STAKING_OPERATION_NOT_IMPLEMENTED = 'operation-not-implemented';
export const STAKING_OPERATION_NOT_SUPPORTED = 'operation-not-supported';

export type UnimplementedStakingOperations = Pick<
    StakingProductAdapter,
    'planOperation' | 'composeStep' | 'signStep' | 'broadcastStep'
>;

export const createUnimplementedStakingOperations = (): UnimplementedStakingOperations => {
    const reject = () => Promise.reject(new StakingAdapterError(STAKING_OPERATION_NOT_IMPLEMENTED));

    return {
        planOperation: reject,
        composeStep: reject,
        signStep: reject,
        broadcastStep: reject,
    };
};
