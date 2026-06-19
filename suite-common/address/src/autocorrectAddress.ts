import { type NetworkSymbol } from '@suite-common/wallet-config';

import type { AddressValidator } from './AddressValidator';
import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';
import { isBech32AddressUppercase } from './isBech32AddressUppercase';
import { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';

export type AddressCorrection = { corrected: string; type: 'lowercase' | 'bchPrefix' } | null;

type AutocorrectAddressParams = {
    addressValidator: AddressValidator;
    address: string;
    symbol: NetworkSymbol;
};

// Bech32 and CashAddr addresses are valid as uppercase but are not accepted by Trezor.
// BCH addresses require the `bitcoincash:` prefix.
export const autocorrectAddress = ({
    addressValidator,
    address,
    symbol,
}: AutocorrectAddressParams): AddressCorrection => {
    if (isBitcoinCashAddressUppercase(address) || isBech32AddressUppercase(address)) {
        const lowercased = address.toLowerCase();

        if (addressValidator.isAddressValid(lowercased, symbol)) {
            return { corrected: lowercased, type: 'lowercase' };
        }
    }

    if (symbol === 'bch' && !hasBitcoinCashAddressPrefix(address)) {
        const corrected = `bitcoincash:${address.toLowerCase()}`;

        if (addressValidator.isAddressValid(corrected, symbol)) {
            return { corrected, type: 'bchPrefix' };
        }
    }

    return null;
};
