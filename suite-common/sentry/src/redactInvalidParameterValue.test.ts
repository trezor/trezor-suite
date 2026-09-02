import type { ErrorEvent } from '@sentry/core';

import { redactInvalidParameterValue } from './redactInvalidParameterValue';

const ADDRESS = 'addr1q9xy8z0uv0h9k5v6v7v8v9wawbwcwdwewfwgwhwiwjwkwlwmwnwowpwqwrws';
const TXID = 'a49b8d0d0f00f6db8bd5f2f5e5b0a5f0ef7b0ee0f1a2b3c4d5e6f7a8b9c0d1e2';

// The exact shape `@trezor/schema-utils` gives an `InvalidParameter` thrown while validating
// `cardanoComposeTransaction` params.
const INVALID_PARAMETER_MESSAGE =
    `Invalid parameter "account.utxo" ` +
    `(= [{"txid":"${TXID}","address":"${ADDRESS}","amount":"4200000"}])` +
    `: Expected string`;

const asErrorEvent = (event: Partial<ErrorEvent>) => event as ErrorEvent;

const getExceptionValue = (event: ErrorEvent | null) => event?.exception?.values?.[0]?.value;

describe('redactInvalidParameterValue', () => {
    it('strips the account payload that @trezor/schema-utils embeds in a validation error', () => {
        const event = asErrorEvent({
            exception: { values: [{ type: 'Error', value: INVALID_PARAMETER_MESSAGE }] },
        });

        expect(getExceptionValue(redactInvalidParameterValue(event))).toBe(
            'Invalid parameter "account.utxo" (= <redacted>)',
        );
    });

    it('strips the payload from a message truncated before its closing parenthesis', () => {
        const event = asErrorEvent({
            exception: {
                values: [{ type: 'Error', value: INVALID_PARAMETER_MESSAGE.slice(0, 80) }],
            },
        });

        expect(getExceptionValue(redactInvalidParameterValue(event))).toBe(
            'Invalid parameter "account.utxo" (= <redacted>)',
        );
    });

    it.each([
        [
            'a nested breadcrumb',
            asErrorEvent({ breadcrumbs: [{ message: INVALID_PARAMETER_MESSAGE }] }),
        ],
        [
            'an extra',
            asErrorEvent({ extra: { arguments: [{ reason: INVALID_PARAMETER_MESSAGE }] } }),
        ],
        [
            'the event message',
            asErrorEvent({ message: INVALID_PARAMETER_MESSAGE, logger: 'console' }),
        ],
    ])('strips the payload from %s', (_name, event) => {
        const redacted = JSON.stringify(redactInvalidParameterValue(event));

        expect(redacted).not.toContain(ADDRESS);
        expect(redacted).not.toContain(TXID);
        expect(redacted).toContain('<redacted>');
    });

    it.each([
        [
            'contains the closing sequence itself',
            'Invalid parameter "account.label" (= "spent (= 1): here"): Expected string',
        ],
        [
            'contains the closing sequence and is truncated before the real one',
            'Invalid parameter "account.label" (= "spent (= 1): here',
        ],
        [
            'is followed by a second, truncated validation error',
            'Invalid parameter "a" (= 1): Expected string, Invalid parameter "account.label" (= "here"',
        ],
    ])('strips a payload that %s', (_name, value) => {
        const event = asErrorEvent({ exception: { values: [{ type: 'Error', value }] } });

        expect(getExceptionValue(redactInvalidParameterValue(event))).not.toContain('here');
    });

    it('keeps two validation errors in one event separate instead of merging them', () => {
        const event = asErrorEvent({
            exception: {
                values: [
                    { type: 'Error', value: INVALID_PARAMETER_MESSAGE },
                    { type: 'Error', value: 'Device disconnected' },
                ],
            },
        });

        const redacted = redactInvalidParameterValue(event);

        expect(redacted?.exception?.values?.[1]?.value).toBe('Device disconnected');
    });

    it('leaves an unrelated event untouched', () => {
        const event = asErrorEvent({
            exception: { values: [{ type: 'Error', value: 'Device disconnected' }] },
        });

        expect(redactInvalidParameterValue(event)).toEqual(event);
    });

    it('passes a filtered-out event through', () => {
        expect(redactInvalidParameterValue(null)).toBeNull();
    });
});
