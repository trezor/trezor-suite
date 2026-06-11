import { err, ok } from '@trezor/type-utils';

import { parseTransferUri } from '../parseTransferUri';

describe(parseTransferUri.name, () => {
    it('errors with INVALID_URI for a plain address (not a URI)', () => {
        expect(parseTransferUri('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toEqual(
            err({ type: 'INVALID_URI' }),
        );
    });

    it('parses a bare bitcoin URI', () => {
        expect(parseTransferUri('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toEqual(
            ok({
                scheme: 'bitcoin',
                address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                amount: undefined,
                label: undefined,
                message: undefined,
            }),
        );
    });

    it('parses amount, label and message (BIP-321 params)', () => {
        expect(
            parseTransferUri(
                'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0123&label=Alice&message=Donation%20for%20project',
            ),
        ).toEqual(
            ok({
                scheme: 'bitcoin',
                address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                amount: '0.0123',
                label: 'Alice',
                message: 'Donation for project',
            }),
        );
    });

    it('keeps the amount as a string to preserve precision', () => {
        expect(parseTransferUri('bitcoin:bc1qaddr?amount=0.00000001')).toMatchObject({
            success: true,
            payload: { amount: '0.00000001' },
        });
    });

    it('ignores a zero or negative amount', () => {
        expect(parseTransferUri('bitcoin:bc1qaddr?amount=0')).toMatchObject({
            success: true,
            payload: { amount: undefined },
        });
    });

    it('parses the address from the host form (bitcoin://addr)', () => {
        expect(parseTransferUri('bitcoin://bc1qaddr?amount=1')).toMatchObject({
            success: true,
            payload: { address: 'bc1qaddr', amount: '1' },
        });
    });

    it('errors with UNKNOWN_SCHEME for an unknown scheme', () => {
        expect(parseTransferUri('mailto:someone@example.com')).toEqual(
            err({ type: 'UNKNOWN_SCHEME', scheme: 'mailto' }),
        );
    });

    it('errors with INVALID_URI when amount is repeated', () => {
        expect(parseTransferUri('bitcoin:bc1qaddr?amount=1&amount=2')).toEqual(
            err({ type: 'INVALID_URI' }),
        );
    });

    it('errors with INVALID_URI when label is repeated', () => {
        expect(parseTransferUri('bitcoin:bc1qaddr?label=Alice&label=Bob')).toEqual(
            err({ type: 'INVALID_URI' }),
        );
    });
});
