const REPORTABLE_STRING_KEYS = new Set(['type', 'kind', 'code']);
const REDACTED = '[redacted]';

const isPlainObject = (value: object): value is Record<string, unknown> => {
    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
};

const redact = (value: unknown, key: string | null): unknown => {
    if (typeof value === 'string') {
        return key !== null && REPORTABLE_STRING_KEYS.has(key) ? value : REDACTED;
    }

    if (value === null || typeof value !== 'object') {
        return typeof value === 'number' || typeof value === 'boolean' ? value : REDACTED;
    }

    if (value instanceof Error) {
        return { name: value.name };
    }

    if (Array.isArray(value)) {
        return value.map(item => redact(item, null));
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [
                entryKey,
                redact(entryValue, entryKey),
            ]),
        );
    }

    return REDACTED;
};

/**
 * `console.error` output is forwarded to Sentry, and Suite Sync error causes carry the rejected
 * row (labels, descriptors, addresses, txids), owner identifiers or key material. Only
 * discriminator keys survive; every other string, binary payload and Error message is dropped.
 */
export const serializeSuiteSyncErrorForReport = (error: unknown): string =>
    JSON.stringify(redact(error, null));
