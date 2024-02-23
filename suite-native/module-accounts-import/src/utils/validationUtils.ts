import { getNetworkType, NetworkSymbol } from '@suite-common/wallet-config';
import { isAddressBasedNetwork, isAddressValid } from '@suite-common/wallet-utils';

type XpubValidationMapType = Partial<Record<NetworkSymbol, string[]>>;

const XPUB_PREFIX_LENGTH = 4;

const xpubValidationsMap: XpubValidationMapType = {
    btc: ['xpub', 'ypub', 'zpub', 'Ypub', 'Zpub'],
};

export const isValidXpub = (xpub: string, networkSymbol: NetworkSymbol) => {
    const xpubPrefix = xpub.slice(0, XPUB_PREFIX_LENGTH);
    const xpubAllowedPrefixes = xpubValidationsMap[networkSymbol];

    // If no validation is provided for network symbol, it's valid by default.
    if (!xpubAllowedPrefixes) return true;

    return xpubAllowedPrefixes.some(prefix => prefix === xpubPrefix);
};

type PassedValidationResult = { isValid: true };
type FailedValidationResult = { isValid: false; failedOn: 'address' | 'xpub' };
type ValidationResult = PassedValidationResult | FailedValidationResult;
export const validateXpub = (
    xpubAddress: string,
    networkSymbol: NetworkSymbol,
): ValidationResult => {
    const networkType = getNetworkType(networkSymbol);
    if (
        xpubAddress &&
        !isAddressBasedNetwork(networkType) &&
        isAddressValid(xpubAddress, networkSymbol)
    ) {
        return { isValid: true };
    }

    // For now, we only validate BTC xpubs
    if (networkSymbol === 'btc') {
        return isValidXpub(xpubAddress, networkSymbol)
            ? { isValid: true }
            : { isValid: false, failedOn: 'xpub' };
    }

    return { isValid: true };
};
