export const TRON_STAKE_FLOW_STEPS = ['freeze', 'vote', 'complete'] as const;
export const TRON_RESOURCE_TYPES = ['bandwidth', 'energy'] as const;

export type TronStakeStepId = (typeof TRON_STAKE_FLOW_STEPS)[number];
export type TronResourceType = (typeof TRON_RESOURCE_TYPES)[number];
