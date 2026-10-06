export const TRON_FLOWS = ['stake', 'vote', 'unstake', 'withdraw', 'claim'] as const;
export type TronFlow = (typeof TRON_FLOWS)[number];

export const TRON_FLOW_STEPS = {
    stake: ['freeze', 'vote', 'complete'],
    vote: ['vote', 'complete'],
    unstake: ['unstake', 'complete'],
    withdraw: ['withdraw', 'complete'],
    claim: ['claim', 'complete'],
} as const satisfies Record<TronFlow, readonly string[]>;

export type TronStakeStepId = (typeof TRON_FLOW_STEPS)[TronFlow][number];

export type TronStakeErrorKind =
    | 'compose-failed'
    | 'report-failed'
    | 'sign-failed'
    | 'broadcast-failed'
    | 'confirmation-failed'
    | 'cancelled';
export type TronStakeError = { kind: TronStakeErrorKind; message?: string };
