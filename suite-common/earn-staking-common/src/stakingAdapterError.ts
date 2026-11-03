export class StakingAdapterError extends Error {
    readonly code: string;

    constructor(code: string) {
        super(code);
        this.name = 'StakingAdapterError';
        this.code = code;
    }
}

export const isStakingAdapterError = (error: unknown): error is StakingAdapterError =>
    error instanceof StakingAdapterError;

export const STAKING_SIGNING_ERROR_CODES = {
    cancelled: 'signing-cancelled',
    expired: 'signing-expired',
} as const;

export type StakingSigningErrorCode =
    (typeof STAKING_SIGNING_ERROR_CODES)[keyof typeof STAKING_SIGNING_ERROR_CODES];

const SIGNING_CANCELLED_CONNECT_CODES = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Method_Cancel',
];

export type StakingConnectFailure = {
    error: string;
    code?: string;
};

export const getStakingSigningErrorCode = ({ error, code }: StakingConnectFailure): string => {
    if (error === 'tx-timeout') return STAKING_SIGNING_ERROR_CODES.expired;

    if (error === 'tx-cancelled' || SIGNING_CANCELLED_CONNECT_CODES.includes(code ?? '')) {
        return STAKING_SIGNING_ERROR_CODES.cancelled;
    }

    return code ?? error;
};
