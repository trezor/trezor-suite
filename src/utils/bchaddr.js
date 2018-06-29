/* @flow */
import bchaddrjs from 'bchaddrjs';

// Cashaddr format is neither base58 nor bech32, so it would fail
// in bitcoinjs-lib-zchash. For this reason use legacy format
export const convertCashAddress = (address: string): string => {
    try {
        if (bchaddrjs.isCashAddress(address)) {
            return bchaddrjs.toLegacyAddress(address);
        }
    } catch (e) {
        // noting
    }
    return address;
};
