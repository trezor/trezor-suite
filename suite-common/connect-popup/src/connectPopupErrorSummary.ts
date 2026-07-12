import { type CallMethodKeys } from '@trezor/connect';
import { serializeError } from '@trezor/connect-common/src/constants/errors';

// Sentry's captureConsoleIntegration turns every `console.error` into an event whose body is not
// scrubbed (redactSentryEvent), so logging a whole Connect error leaks its message/stack — which can
// embed a derivation path, address, or tx data — off-device. `code` (constant enum) and `method` are
// the only leak-free fields. See #29663.
export const connectPopupErrorSummary = (method: CallMethodKeys, error: unknown) => ({
    // Default because serializeError yields a `code` only for an `Error`, not for other payloads.
    code: serializeError(error).code ?? 'Failure_UnknownCode',
    method,
});
