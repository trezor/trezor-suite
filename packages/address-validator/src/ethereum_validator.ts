/* eslint-disable import/no-default-export */
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const validator = {
    isValidAddress(address: string): boolean {
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
            // Check if it has the basic requirements of an address
            return false;
        }

        if (/^0x[0-9a-f]{40}$/.test(address) || /^0x?[0-9A-F]{40}$/.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        }

        return this.verifyChecksum(address);
    },
    verifyChecksum(address: string): boolean {
        const stripped = address.replace('0x', '');
        const addressHash = cryptoUtils.keccak256(stripped.toLowerCase());

        for (let i = 0; i < 40; i++) {
            if (
                (parseInt(addressHash[i], 16) > 7 && stripped[i].toUpperCase() !== stripped[i]) ||
                (parseInt(addressHash[i], 16) <= 7 && stripped[i].toLowerCase() !== stripped[i])
            ) {
                return false;
            }
        }

        return true;
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
