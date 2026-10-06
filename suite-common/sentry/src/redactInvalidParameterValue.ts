import type { ErrorEvent } from '@sentry/core';

import { type ChainableBeforeSend } from './types';

// `@trezor/schema-utils` builds parameter validation errors as
// `Invalid parameter "account.utxo" (= [{"txid":…}]): Expected string`, embedding the rejected
// value in the message. TrezorConnect passes that message back to its caller, so an error escaping
// a call can carry account data (descriptors, addresses, UTXOs, amounts) into a Sentry event.
// Callers are expected to drop such messages, this is the last line of defense. The field name is
// kept, because it is what makes the report actionable.
// Only the prefix is matched by a regex. A pattern spanning the value up to its closing `): `
// would rescan the rest of the message for every `Invalid parameter "` inside it, which is
// quadratic in the length of a message an attacker can influence.
const INVALID_PARAMETER_PREFIX = /Invalid parameter "[^"]*" \(= /;

const REDACTED = '<redacted>';

// Deeper than Sentry's own `normalizeDepth`, so the whole event is covered.
const MAX_DEPTH = 10;

const redactInvalidParameterValueFromString = (value: string) => {
    const prefix = INVALID_PARAMETER_PREFIX.exec(value);

    if (prefix === null) {
        return value;
    }

    // Everything past the prefix is dropped, the trailing reason included. Keeping the reason
    // would mean locating the closing `): ` and so trusting the embedded value not to contain one,
    // and a message Sentry truncated (see `maxValueLength`) has no closing sequence at all.
    return `${value.slice(0, prefix.index + prefix[0].length)}${REDACTED})`;
};

// Rebuilding is only safe for structures a plain object can round-trip. Anything else (a class
// instance, a Date) is left as it is rather than flattened into a plain object.
const isPlainObject = (value: object) => {
    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
};

const redactStrings = (value: unknown, depth: number): unknown => {
    if (typeof value === 'string') {
        return redactInvalidParameterValueFromString(value);
    }

    if (value === null || typeof value !== 'object' || depth >= MAX_DEPTH) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => redactStrings(item, depth + 1));
    }

    if (!isPlainObject(value)) {
        return value;
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, redactStrings(item, depth + 1)]),
    );
};

/**
 * Strips values embedded in TrezorConnect parameter validation errors from anywhere in a Sentry
 * event (exception message, stack, breadcrumbs, extras).
 */
export const redactInvalidParameterValue: ChainableBeforeSend = event =>
    event === null ? null : (redactStrings(event, 0) as ErrorEvent);
