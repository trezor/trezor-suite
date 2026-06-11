import { type Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { safeParseUrl } from './parseUtils';

/**
 * Structured transfer request decoded from a BIP-321 / BIP-21 URI.
 * @see https://github.com/bitcoin/bips/blob/master/bip-0321.mediawiki
 * @see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
 */
export type TransferUriInfo = {
    scheme: Protocol;
    address: string;
    amount?: string; // kept as string to preserve precision
    label?: string; // recipient label
    message?: string; // note to the payer
};

export type TransferUriError =
    | { type: 'INVALID_URI' } // not a URI, or a malformed one (e.g. a plain address, a repeated param)
    | { type: 'MISSING_ADDRESS' } // valid scheme but no address present
    | { type: 'UNKNOWN_SCHEME'; scheme: string }; // not a recognized crypto protocol

export type TransferUriResult = Result<TransferUriInfo, TransferUriError>;

const SINGLE_VALUE_PARAMS = ['amount', 'label', 'message'] as const;

const removeLeadingTrailingSlashes = (text: string) => text.replace(/^\/{0,2}|\/$/g, '');

/**
 * Parses a transfer URI (BIP-321 / BIP-21) into its structured fields.
 */
export const parseTransferUri = (uri: string): TransferUriResult => {
    const url = safeParseUrl(uri);
    if (!url) return err({ type: 'INVALID_URI' });

    const { protocol, pathname, host, searchParams } = url;
    const scheme = protocol.slice(0, -1) as Protocol;

    if (!getNetworkSymbolForProtocol(scheme)) {
        return err({ type: 'UNKNOWN_SCHEME', scheme });
    }

    const address = removeLeadingTrailingSlashes(pathname) || removeLeadingTrailingSlashes(host);
    if (!address) return err({ type: 'MISSING_ADDRESS' });

    // BIP-321: a recognized parameter must not appear more than once — treat it as a malformed URI.
    const hasDuplicateParam = SINGLE_VALUE_PARAMS.some(
        param => searchParams.getAll(param).length > 1,
    );
    if (hasDuplicateParam) return err({ type: 'INVALID_URI' });

    const rawAmount = searchParams.get('amount');
    const floatAmount = Number.parseFloat(rawAmount ?? '');
    const amount = !Number.isNaN(floatAmount) && floatAmount > 0 ? rawAmount! : undefined;

    return ok({
        scheme,
        address,
        amount,
        label: searchParams.get('label') ?? undefined,
        message: searchParams.get('message') ?? undefined,
    });
};
