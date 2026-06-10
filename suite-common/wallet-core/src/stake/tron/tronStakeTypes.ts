export const TRON_STAKE_FLOW_STEPS = ['freeze', 'vote', 'complete'] as const;
export const TRON_RESOURCE_TYPES = ['bandwidth', 'energy'] as const;

export type TronStakeStepId = (typeof TRON_STAKE_FLOW_STEPS)[number];
export type TronResourceType = (typeof TRON_RESOURCE_TYPES)[number];

export type TronStakeErrorKind =
    | 'compose-failed'
    | 'sign-failed'
    | 'broadcast-failed'
    | 'confirmation-failed'
    | 'cancelled';
export type TronStakeError = { kind: TronStakeErrorKind; message?: string };
