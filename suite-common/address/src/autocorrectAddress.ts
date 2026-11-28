import { type AddressValidator } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';
import { isBech32AddressUppercase } from './isBech32AddressUppercase';
import { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';

export type AddressCorrection = {
    corrected: string;
    type: 'lowercase' | 'bchPrefix' | 'hexPrefix';
} | null;

type AutocorrectAddressParams = {
    addressValidator: AddressValidator;
    address: string;
    symbol: NetworkSymbol;
};

// Bech32 and CashAddr addresses are valid as uppercase but are not accepted by Trezor.
// BCH addresses require the `bitcoincash:` prefix.
// Hex addresses (EVM) are accepted only with a lowercase `0x` prefix, so `0X` is lowercased.
export const autocorrectAddress = ({
    addressValidator,
    address,
    symbol,
}: AutocorrectAddressParams): AddressCorrection => {
    if (isBitcoinCashAddressUppercase(address) || isBech32AddressUppercase(address)) {
        const lowercased = address.toLowerCase();

        if (addressValidator.isAddressValid(symbol, lowercased)) {
            return { corrected: lowercased, type: 'lowercase' };
        }
    }

    if (address.startsWith('0X')) {
        const corrected = `0x${address.slice(2)}`;

        if (addressValidator.isAddressValid(corrected, symbol)) {
            return { corrected, type: 'hexPrefix' };
        }
    }

    if (symbol === 'bch' && !hasBitcoinCashAddressPrefix(address)) {
        const corrected = `bitcoincash:${address.toLowerCase()}`;

        if (addressValidator.isAddressValid(symbol, corrected)) {
            return { corrected, type: 'bchPrefix' };
        }
    }

    return null;
};
