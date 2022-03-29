import type { CoinInfo } from '../types';

export const getNetworkLabel = (label: string, network?: CoinInfo) => {
    if (network) {
        const name = network.name.toLowerCase().indexOf('testnet') >= 0 ? 'Testnet' : network.name;
        return label.replace('#NETWORK', name);
    }
    return label.replace('#NETWORK', '');
};
