import type { FindNetworkSymbolForProtocol } from '@suite-common/networks';
import { type Protocol, asProtocol } from '@trezor/network-module-suite-common-types';
import { err, ok } from '@trezor/type-utils';
import { safeParseUrl } from '@trezor/utils';

import { parseBip321Uri } from './parseBip321Uri';
import { type Erc681TransferInfo, parseErc681TransferUri } from './parseErc681TransferUri';
import { type ErcTransferUriInfo, type TransferUriResult } from './transferUtils';

const erc681ToTransferUriInfo = (
    erc681: Erc681TransferInfo,
    scheme: Protocol,
): ErcTransferUriInfo => ({
    format: 'erc681',
    // Prefer the network resolved from the @chainId; otherwise keep the URI scheme.
    scheme: erc681.networkSymbol ? asProtocol(erc681.networkSymbol) : scheme,
    networkSymbol: erc681.networkSymbol,
    address: erc681.recipientAddress,
    token: erc681.contractAddress,
    tokenAmount: erc681.tokenAmount,
});

/**
 * Central entry point for decoding a transfer URI.
 *
 * Validates the URI and scheme once, then dispatches to the format-specific
 * parsers. ERC-681 (Ethereum) is tried first because it extracts the transfer
 * recipient rather than the contract address; everything else is handled as a
 * BIP-321 / BIP-21 URI.
 */
export const parseTransferUri = (
    uri: string,
    findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol,
): TransferUriResult => {
    const url = safeParseUrl(uri);
    if (!url) return err({ type: 'INVALID_URI' });

    const scheme = asProtocol(url.protocol.slice(0, -1));
    if (!findNetworkSymbolForProtocol(scheme)) {
        return err({ type: 'UNKNOWN_SCHEME', scheme });
    }

    if (scheme === 'ethereum') {
        const erc681 = parseErc681TransferUri(uri);
        if (erc681) return ok(erc681ToTransferUriInfo(erc681, scheme));
    }

    return parseBip321Uri(url);
};
