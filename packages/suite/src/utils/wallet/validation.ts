// @ts-ignore for now
import addressValidator from 'wallet-address-validator';
import { Network } from '@wallet-types';

export const validateAddress = (network: Network['networkType'], address: string) => {
    const upperCaseAddress = address.toUpperCase();
    switch (network) {
        case 'ethereum':
        case 'bitcoin':
        case 'ripple':
            return addressValidator.validate(upperCaseAddress, network);
        // no default
    }
};
