import { type ERRORS } from '@trezor/connect-common';

export class StakingAdapterError extends Error {
    readonly code: string;

    constructor(code: string) {
        super(code);
        this.name = 'StakingAdapterError';
        this.code = code;
    }
}

export const isStakingAdapterError = (error: unknown): error is StakingAdapterError =>
    error instanceof StakingAdapterError && error.name === 'StakingAdapterError';

export const STAKING_SIGNING_ERROR_CODES = {
    cancelled: 'signing-cancelled',
    expired: 'signing-expired',
    failed: 'signing-failed',
} as const;

export type StakingSigningErrorCode =
    (typeof STAKING_SIGNING_ERROR_CODES)[keyof typeof STAKING_SIGNING_ERROR_CODES];

const SIGNING_CANCELLED_CONNECT_CODES = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Method_Cancel',
] as const satisfies ERRORS.ErrorCode[];

export type StakingConnectFailure = {
    error: string;
    code?: string;
};

export const getStakingSigningErrorCode = ({ error, code }: StakingConnectFailure): string => {
    if (error === 'tx-timeout') {
        return STAKING_SIGNING_ERROR_CODES.expired;
    }

    if (
        error === 'tx-cancelled' ||
        SIGNING_CANCELLED_CONNECT_CODES.some(cancelledCode => cancelledCode === code)
    ) {
        return STAKING_SIGNING_ERROR_CODES.cancelled;
    }

    return code ?? STAKING_SIGNING_ERROR_CODES.failed;
};
