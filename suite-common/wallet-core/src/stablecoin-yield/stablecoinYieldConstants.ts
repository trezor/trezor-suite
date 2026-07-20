import type { YieldFlowStepId, YieldFlowType } from './stablecoinYieldTypes';

export const STABLECOIN_YIELD_PREFIX = '@suite-common/wallet-core/stablecoin-yield';

export const YIELD_FLOW_STEP_SEQUENCES = {
    // The deposit flow carries a leading `wrap` step (ETH→WETH). It is used only for native-token
    // deposits; normal token deposits start at `approve` — see
    // `createInitialStablecoinYieldSessionState`.
    deposit: ['wrap', 'approve', 'action', 'complete'],
    withdraw: ['action', 'complete'],
    redeem: ['action', 'complete'],
    claim: ['action', 'complete'],
} as const satisfies Record<YieldFlowType, readonly YieldFlowStepId[]>;
