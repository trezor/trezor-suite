// Message ids must exist in the desktop `suite/intl` messages — the desktop app renders
// `session.error.message` directly via `<Translation>`.
export type StablecoinYieldTranslationKey =
    | 'TR_EARN_YIELD_ERROR_GENERIC'
    | 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT'
    | 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';

export type YieldDepositErrorReason =
    | 'unsupported-network'
    | 'missing-deposit-params'
    | 'vault-chain-mismatch'
    | 'missing-fee-level'
    | 'compose-failed';

// Codes produced deliberately by the yield flows. Device/backend codes coming from
// TrezorConnect responses (e.g. 'Failure_ActionCancelled') arrive as opaque strings on top
// of this union. Codes are rendered in the UI banner and reported to analytics, so they
// must never contain account or device data.
export type StablecoinYieldKnownErrorCode =
    | YieldDepositErrorReason
    | 'missing-approval-contract-address'
    | 'missing-revoke-spender'
    | 'missing-approval-request-amount'
    | 'missing-approval-params'
    | 'approve-failed'
    | 'missing-flow-tokens'
    | 'missing-device'
    | 'missing-device-session'
    | 'device-state-failed'
    | 'sign-failed'
    | 'push-failed'
    | 'transaction-failed'
    | 'submit-failed';

export type StablecoinYieldErrorState = {
    message: StablecoinYieldTranslationKey;
    code: string;
};

const KNOWN_ERROR_TRANSLATION_KEYS: Record<
    StablecoinYieldKnownErrorCode,
    StablecoinYieldTranslationKey
> = {
    'unsupported-network': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-deposit-params': 'TR_EARN_YIELD_ERROR_GENERIC',
    'vault-chain-mismatch': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-fee-level': 'TR_EARN_YIELD_ERROR_GENERIC',
    'compose-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-approval-contract-address': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-revoke-spender': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-approval-request-amount': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-approval-params': 'TR_EARN_YIELD_ERROR_GENERIC',
    'approve-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-flow-tokens': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-device': 'TR_EARN_YIELD_ERROR_GENERIC',
    'missing-device-session': 'TR_EARN_YIELD_ERROR_GENERIC',
    'device-state-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
    'sign-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
    'push-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
    'transaction-failed': 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED',
    'submit-failed': 'TR_EARN_YIELD_ERROR_GENERIC',
};

const PASSPHRASE_ERROR_CODES: string[] = [
    'Device_InvalidState', // incorrect passphrase submitted
    'Method_Interrupted', // passphrase modal closed
];

export const getYieldErrorTranslationKey = (code: string): StablecoinYieldTranslationKey => {
    if (PASSPHRASE_ERROR_CODES.includes(code)) {
        return 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT';
    }

    return (
        KNOWN_ERROR_TRANSLATION_KEYS[code as StablecoinYieldKnownErrorCode] ??
        'TR_EARN_YIELD_ERROR_GENERIC'
    );
};

export const buildYieldSessionError = (code: string): StablecoinYieldErrorState => ({
    message: getYieldErrorTranslationKey(code),
    code,
});
