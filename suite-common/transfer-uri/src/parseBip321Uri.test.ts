import { type Result, err, ok } from '@trezor/type-utils';

import { parseBip321Uri } from './parseBip321Uri';

const cases: { description: string; uri: string; expected: Result<unknown, unknown> }[] = [
    {
        description: 'parses a bare bitcoin URI',
        uri: 'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
            amount: undefined,
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'parses amount, label and message (BIP-321 params)',
        uri: 'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0123&label=Alice&message=Donation%20for%20project',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
            amount: '0.0123',
            label: 'Alice',
            message: 'Donation for project',
        }),
    },
    {
        description: 'keeps the amount as a string to preserve precision',
        uri: 'bitcoin:bc1qaddr?amount=0.00000001',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: '0.00000001',
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'ignores a zero amount',
        uri: 'bitcoin:bc1qaddr?amount=0',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: undefined,
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'ignores a negative amount',
        uri: 'bitcoin:bc1qaddr?amount=-1',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: undefined,
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'ignores a non-finite amount (Infinity)',
        uri: 'bitcoin:bc1qaddr?amount=Infinity',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: undefined,
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'ignores an amount that overflows to Infinity (1e999)',
        uri: 'bitcoin:bc1qaddr?amount=1e999',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: undefined,
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'parses the address from the host form (bitcoin://addr)',
        uri: 'bitcoin://bc1qaddr?amount=1',
        expected: ok({
            format: 'bip321',
            scheme: 'bitcoin',
            address: 'bc1qaddr',
            amount: '1',
            label: undefined,
            message: undefined,
        }),
    },
    {
        description: 'errors with MISSING_ADDRESS when the URI has no address',
        uri: 'bitcoin:?amount=1',
        expected: err({ type: 'MISSING_ADDRESS' }),
    },
    {
        description: 'errors with INVALID_URI when amount is repeated',
        uri: 'bitcoin:bc1qaddr?amount=1&amount=2',
        expected: err({ type: 'INVALID_URI' }),
    },
    {
        description: 'errors with INVALID_URI when label is repeated',
        uri: 'bitcoin:bc1qaddr?label=Alice&label=Bob',
        expected: err({ type: 'INVALID_URI' }),
    },
];

describe(parseBip321Uri.name, () => {
    it.each(cases)('$description', ({ uri, expected }) => {
        expect(parseBip321Uri(new URL(uri))).toEqual(expected);
    });
});
