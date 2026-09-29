import type { NonceFailure, NonceFailureCode } from '@suite/desktop-app-api';

const RETRYABLE: Record<NonceFailureCode, boolean> = {
    UNSUPPORTED_CHAIN: false,
    INVALID_REQUEST: false,
    TRUST_CONFIG_INVALID: false,
    NATIVE_UNAVAILABLE: false,
    PROVIDER_UNAVAILABLE: true,
    INVALID_PROOF: false,
    STALE_PROOF: true,
    CLOCK_INVALID: false,
    METADATA_UNAVAILABLE: true,
    LIMIT_EXCEEDED: false,
    TIMEOUT: true,
    CANCELLED: false,
    WORKER_CRASHED: true,
    VERIFICATION_FAILED: false,
};

export const createNonceFailure = (requestId: string, code: NonceFailureCode): NonceFailure => ({
    status: 'failed',
    requestId,
    code,
    retryable: RETRYABLE[code],
});

// Only exact, documented verifier messages get a specific code. Everything else is a generic
// verification failure: guessing "the provider is malicious" from a substring is not a safe basis
// for a security decision.
const EXACT_VERIFIER_MESSAGES: Record<string, NonceFailureCode> = {
    'proof for latest too old': 'STALE_PROOF',
};

export const mapVerifierError = (message: string): NonceFailureCode =>
    EXACT_VERIFIER_MESSAGES[message.trim()] ?? 'VERIFICATION_FAILED';
