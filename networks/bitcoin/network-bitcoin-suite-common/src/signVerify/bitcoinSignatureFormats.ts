import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { AccountType } from '@trezor/network-module-suite-common-types';

import { getNetworkConfig } from '../networkConfig';

export const BITCOIN_SIGNATURE_FORMATS = ['trezor', 'electrum'] as const;

export type BitcoinSignatureFormat = (typeof BITCOIN_SIGNATURE_FORMATS)[number];

export const BITCOIN_DEFAULT_SIGNATURE_FORMAT: BitcoinSignatureFormat = 'trezor';

export const getBitcoinSignatureFormats = (
    networkSymbol: BitcoinNetworkSymbol,
    accountType: AccountType,
): readonly BitcoinSignatureFormat[] => {
    // A network without accountTypes has only 'normal' accounts, where both formats sign the same.
    if (Object.keys(getNetworkConfig(networkSymbol).accountTypes).length === 0) {
        return [];
    }

    return accountType === 'legacy' ? [] : BITCOIN_SIGNATURE_FORMATS;
};
