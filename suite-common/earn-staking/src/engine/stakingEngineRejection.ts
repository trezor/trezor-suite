export const STAKING_ENGINE_REJECTIONS = [
    'account-not-found',
    'product-not-found',
    'session-not-found',
    'session-active',
    'session-replaced',
    'step-not-ready',
    'step-expired',
    'step-in-flight',
    'adapter-failed',
    'cancelled',
    'invalid-custom-fee',
] as const;

export type StakingEngineRejection = (typeof STAKING_ENGINE_REJECTIONS)[number];
