import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAddressValid } from '@trezor/address-validator';

import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';
import { isBech32AddressUppercase } from './isBech32AddressUppercase';
import { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';

export type AddressCorrection = { corrected: string; type: 'lowercase' | 'bchPrefix' } | null;

// Bech32 and CashAddr addresses are valid as uppercase but are not accepted by Trezor.
// BCH addresses require the `bitcoincash:` prefix.
export const autocorrectAddress = (address: string, symbol: NetworkSymbol): AddressCorrection => {
    if (isBitcoinCashAddressUppercase(address) || isBech32AddressUppercase(address)) {
        const lowercased = address.toLowerCase();

        if (isAddressValid(lowercased, symbol)) {
            return { corrected: lowercased, type: 'lowercase' };
        }
    }

    if (symbol === 'bch' && !hasBitcoinCashAddressPrefix(address)) {
        const corrected = `bitcoincash:${address.toLowerCase()}`;

        if (isAddressValid(corrected, symbol)) {
            return { corrected, type: 'bchPrefix' };
        }
    }

    return null;
};
