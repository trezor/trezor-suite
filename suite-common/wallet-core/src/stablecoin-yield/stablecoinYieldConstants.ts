import type { YieldFlowStepId, YieldFlowType } from './stablecoinYieldTypes';

export const STABLECOIN_YIELD_PREFIX = '@suite-common/wallet-core/stablecoin-yield';

export const YIELD_FLOW_STEP_SEQUENCES = {
    deposit: ['approve', 'action', 'complete'],
    withdraw: ['action', 'complete'],
    redeem: ['action', 'complete'],
    claim: ['action', 'complete'],
} as const satisfies Record<YieldFlowType, readonly YieldFlowStepId[]>;
