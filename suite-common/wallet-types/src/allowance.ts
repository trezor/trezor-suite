export type AllowanceTransactionType = 'approve' | 'revoke';

export type AllowanceLimitType = 'minimal' | 'unlimited';

/**
 * The next step the user has to take for a spender to be able to pull the requested amount:
 * - `approve`: there is no usable allowance yet,
 * - `increase`: the allowance exists but is too low and the token lets it grow directly,
 * - `revoke`: the allowance must first be reset to zero (e.g. USDT), or a revoke was requested,
 * - `continue`: the allowance already covers the requested amount.
 *
 * `approve` and `increase` both end in an approve transaction; `continue` needs none.
 */
export type AllowanceAction = AllowanceTransactionType | 'increase' | 'continue';

export type AllowanceStepVariant = Exclude<AllowanceAction, 'continue'>;

export type AllowanceStepState = 'active' | 'pending' | 'done';
