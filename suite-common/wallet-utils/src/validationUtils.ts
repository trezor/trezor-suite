import { toChecksumAddress } from 'web3-utils';

import { type AccountInfo } from '@trezor/blockchain-link-types';

// Re-export address functions from their new home for backwards compatibility.
export {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    hasBitcoinCashAddressPrefix,
    isBitcoinCashAddressUppercase,
    isBech32AddressUppercase,
} from '@suite-common/address';

export const isDecimalsValid = (value: string, decimals: number) => {
    const DECIMALS_RE = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );

    return DECIMALS_RE.test(value);
};

export const isInteger = (value: string) =>
    // exclude leading zeros
    /^(?:[1-9][0-9]*|0)$/.test(value);

export const isHexValid = (value: string, prefix?: string) => {
    // ethereum data/signedTx may start with prefix
    if (prefix && value.indexOf(prefix) === 0) {
        const hex = value.substring(prefix.length, value.length);
        // pad left even, is it necessary in ETH?
        // TODO: investigate
        value = hex.length % 2 !== 0 ? `0${hex}` : hex;
    }

    if (value.length % 2 !== 0) return false;
    // TODO: ETH may contain uppercase? does BTC as well?
    if (!/^[0-9A-Fa-f]+$/.test(value)) return false;

    return true;
};

export const checkIsAddressNotUsedNotChecksummed = (
    address: string,
    history: AccountInfo['history'],
    setChecksummedAddress: (value: string) => void,
    setHasAddressChecksummed: (value: boolean) => void,
) => {
    const hasHistory = history.total !== 0;

    if (hasHistory) {
        setChecksummedAddress(toChecksumAddress(address));
        setHasAddressChecksummed(true);

        return false;
    }

    if (!hasHistory && address === address.toLowerCase()) {
        return true;
    }

    return false;
};
