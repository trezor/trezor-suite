import type { YieldFlowStepId, YieldFlowType } from './stablecoinYieldTypes';

export const STABLECOIN_YIELD_PREFIX = '@suite-common/wallet-core/stablecoin-yield';

/**
 * All steps a flow can go through, in order. Optional steps ('wrap'/'unwrap' — offered only
 * for wrapped-native vaults like WETH) are filtered per situation by `getYieldFlowStepSequence`.
 */
export const YIELD_FLOW_AVAILABLE_STEPS = {
    deposit: ['wrap', 'approve', 'action', 'complete'],
    withdraw: ['action', 'unwrap', 'complete'],
    redeem: ['action', 'unwrap', 'complete'],
    claim: ['action', 'complete'],
} as const satisfies Record<YieldFlowType, readonly YieldFlowStepId[]>;
