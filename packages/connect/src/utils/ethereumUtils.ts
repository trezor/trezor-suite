// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/ethereumUtils.js

import type { CoinInfo } from '../types';

export const getNetworkLabel = (label: string, network?: CoinInfo) => {
    if (network) {
        const name = network.name.toLowerCase().indexOf('testnet') >= 0 ? 'Testnet' : network.name;

        return label.replace('#NETWORK', name);
    }

    return label.replace('#NETWORK', '');
};
