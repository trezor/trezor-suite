import { asProtocol } from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { type BipTransferUriInfo, type TransferUriError } from './transferUtils';

const SINGLE_VALUE_PARAMS = ['amount', 'label', 'message'] as const;

const removeLeadingTrailingSlashes = (text: string) => text.replace(/^\/{0,2}|\/$/g, '');

const isBitcoinBech32AddressUppercase = (address: string) =>
    /^(bc1|tb1)/.test(address.toLowerCase()) && /[A-Z]/.test(address);

/**
 * Extracts BIP-321 / BIP-21 fields from an already-parsed, scheme-validated URL.
 * The URI/scheme validation is done upstream by `parseTransferUri`.
 * @see https://github.com/bitcoin/bips/blob/master/bip-0321.mediawiki
 * @see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
 */
export const parseBip321Uri = (uri: URL): Result<BipTransferUriInfo, TransferUriError> => {
    const { protocol, pathname, host, searchParams } = uri;
    const scheme = asProtocol(protocol.slice(0, -1));

    const rawAddress = removeLeadingTrailingSlashes(pathname) || removeLeadingTrailingSlashes(host);
    if (!rawAddress) return err({ type: 'MISSING_ADDRESS' });

    const address =
        scheme === 'bitcoin' && isBitcoinBech32AddressUppercase(rawAddress)
            ? rawAddress.toLowerCase()
            : rawAddress;

    // BIP-321: a recognized parameter must not appear more than once — treat it as a malformed URI.
    const hasDuplicateParam = SINGLE_VALUE_PARAMS.some(
        param => searchParams.getAll(param).length > 1,
    );
    if (hasDuplicateParam) return err({ type: 'INVALID_URI' });

    const rawAmount = searchParams.get('amount');
    const amount = rawAmount !== null && Number.parseFloat(rawAmount) > 0 ? rawAmount : undefined;

    return ok({
        format: 'bip321',
        scheme,
        address,
        amount,
        label: searchParams.get('label') ?? undefined,
        message: searchParams.get('message') ?? undefined,
    });
};
