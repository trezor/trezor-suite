import { type CallMethodKeys } from '@trezor/connect';
import { serializeError } from '@trezor/connect-common/src/constants/errors';

// Sentry's captureConsoleIntegration turns every `console.error` into an event whose body is not
// scrubbed (redactSentryEvent), so logging a whole Connect error leaks its message/stack — which can
// embed a derivation path, address, or tx data — off-device. `code` (constant enum) and `method` are
// the only leak-free fields. See #29663.
//
// The summary is a string, not an object: captureConsoleIntegration renders a non-Error object arg
// through `[object Object]` into the Sentry message, so an object would collapse every popup error
// into one useless, ungrouped issue. A string keeps the leak-free `{ code, method }` readable in the
// event message and lets Sentry group by it.
export const connectPopupErrorSummary = (method: CallMethodKeys, error: unknown) =>
    // Default because serializeError yields a `code` only for an `Error`, not for other payloads.
    `{ code: ${serializeError(error).code ?? 'Failure_UnknownCode'}, method: ${method} }`;
