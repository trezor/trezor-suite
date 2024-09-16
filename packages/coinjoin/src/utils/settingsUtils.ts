import { networks } from '@trezor/utxo-lib';

import { CoinjoinBackendSettings } from '../types';

export const getCoinjoinNetwork = (network: CoinjoinBackendSettings['network']) => {
    switch (network) {
        case 'btc':
            return networks.bitcoin;
        case 'test':
            return networks.testnet;
        case 'regtest':
            return networks.regtest;
        default:
            throw new Error('Other coins than REGTEST are currently not supported');
    }
};
