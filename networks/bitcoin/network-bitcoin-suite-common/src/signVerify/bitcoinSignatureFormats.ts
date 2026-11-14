import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import {
    type AccountType,
    SignatureFormatNotSupportedError,
    type SignatureFormatNotSupportedErrorType,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { getNetworkConfig } from '../networkConfig';

export const BITCOIN_SIGNATURE_FORMATS = ['trezor', 'electrum'] as const;

export type BitcoinSignatureFormat = (typeof BITCOIN_SIGNATURE_FORMATS)[number];

export const BITCOIN_DEFAULT_SIGNATURE_FORMAT: BitcoinSignatureFormat = 'trezor';

// TODO: Hack: the shared contract passes any network's SignatureFormat, so Bitcoin narrows it back
// to its own formats at runtime. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
export const toBitcoinSignatureFormat = (
    format: string | undefined,
): Result<BitcoinSignatureFormat, SignatureFormatNotSupportedErrorType> => {
    if (format === undefined) {
        return ok(BITCOIN_DEFAULT_SIGNATURE_FORMAT);
    }

    if (!isArrayMember(format, BITCOIN_SIGNATURE_FORMATS)) {
        return err(SignatureFormatNotSupportedError(format));
    }

    return ok(format);
};

export const getBitcoinSignatureFormats = (
    symbol: BitcoinNetworkSymbol,
    accountType: AccountType,
): readonly BitcoinSignatureFormat[] => {
    // A network without accountTypes has only 'normal' accounts, where both formats sign the same.
    if (Object.keys(getNetworkConfig(symbol).accountTypes).length === 0) {
        return [];
    }

    return accountType === 'legacy' ? [] : BITCOIN_SIGNATURE_FORMATS;
};
