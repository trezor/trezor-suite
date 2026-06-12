export const TRON_RESOURCE_TYPES = ['bandwidth', 'energy'] as const;
export type TronResourceType = (typeof TRON_RESOURCE_TYPES)[number];

export const TRON_FLOWS = ['stake', 'vote', 'unstake', 'withdraw'] as const;
export type TronFlow = (typeof TRON_FLOWS)[number];

export const TRON_FLOW_STEPS = {
    stake: ['freeze', 'vote', 'complete'],
    vote: ['vote', 'complete'],
    unstake: ['unstake', 'complete'],
    withdraw: ['withdraw', 'complete'],
} as const satisfies Record<TronFlow, readonly string[]>;

export type TronStakeStepId = (typeof TRON_FLOW_STEPS)[TronFlow][number];

export type TronStakeErrorKind =
    | 'compose-failed'
    | 'sign-failed'
    | 'broadcast-failed'
    | 'confirmation-failed'
    | 'cancelled';
export type TronStakeError = { kind: TronStakeErrorKind; message?: string };
