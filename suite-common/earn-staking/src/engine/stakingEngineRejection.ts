export const STAKING_ENGINE_REJECTIONS = [
    'account-not-found',
    'product-not-found',
    'operation-not-available',
    'session-not-found',
    'session-active',
    'session-replaced',
    'step-not-ready',
    'step-expired',
    'step-in-flight',
    'adapter-failed',
    'cancelled',
    'invalid-custom-fee',
    'attempt-superseded',
] as const;

export type StakingEngineRejection = (typeof STAKING_ENGINE_REJECTIONS)[number];
