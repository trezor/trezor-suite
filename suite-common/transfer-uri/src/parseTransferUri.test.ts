import type { FindNetworkSymbolForProtocol } from '@suite-common/networks';
import { err, ok } from '@trezor/type-utils';

import { parseTransferUri } from './parseTransferUri';

const findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol = protocol => {
    if (protocol === 'bitcoin') return 'btc';
    if (protocol === 'ethereum') return 'eth';

    return null;
};
const parse = (uri: string) => parseTransferUri(uri, findNetworkSymbolForProtocol);

describe(parseTransferUri.name, () => {
    // --- ERC-681 dispatch ---

    it('parses an ERC-681 token transfer (recipient, token, tokenAmount)', () => {
        expect(
            parse(
                'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000',
            ),
        ).toEqual(
            ok({
                format: 'erc681',
                scheme: 'ethereum',
                networkSymbol: undefined,
                address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
                token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
                tokenAmount: '1000000',
            }),
        );
    });

    it('parses a plain ERC-681 ETH receive, resolving scheme from the chainId', () => {
        expect(parse('ethereum:0x8e23ee67d1332ad560396262c48ffbb01f93d052@8453')).toEqual(
            ok({
                format: 'erc681',
                scheme: 'base',
                networkSymbol: 'base',
                address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
                token: undefined,
                tokenAmount: undefined,
            }),
        );
    });

    // --- BIP-321 delegation ---

    it('delegates BIP-321 URIs to the bip321 parser (amount, label, message)', () => {
        expect(
            parse('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0123&label=Alice'),
        ).toEqual(
            ok({
                format: 'bip321',
                scheme: 'bitcoin',
                address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                amount: '0.0123',
                label: 'Alice',
                message: undefined,
            }),
        );
    });

    it('errors with UNKNOWN_SCHEME for an unrecognized scheme', () => {
        expect(parse('mailto:someone@example.com')).toEqual(
            err({ type: 'UNKNOWN_SCHEME', scheme: 'mailto' }),
        );
    });

    it('errors with INVALID_URI for a plain address (not a URI)', () => {
        expect(parse('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toEqual(
            err({ type: 'INVALID_URI' }),
        );
    });
});
