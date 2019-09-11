// @ts-ignore for now
import addressValidator from 'wallet-address-validator';
import { Account } from '@wallet-types';

export const isAddressValid = (address: string, network: Account['networkType']) => {
    switch (network) {
        case 'ethereum':
        case 'bitcoin':
        case 'ripple':
            return addressValidator.validate(address, network);
        // no default
    }
};
