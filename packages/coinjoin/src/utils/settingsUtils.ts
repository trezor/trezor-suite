import { networks } from '@trezor/utxo-lib';

import { CoinjoinBackendSettings } from '../types';

export const getNetwork = (network: CoinjoinBackendSettings['network']) => {
    switch (network) {
        case 'regtest':
            return networks.regtest;
        default:
            throw new Error('Other coins than REGTEST are currently not supported');
    }
};
