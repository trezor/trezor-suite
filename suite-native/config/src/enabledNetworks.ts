import {
    networks,
    NetworkSymbol,
    Network,
    getTestnets,
    getMainnets,
} from '@suite-common/wallet-config';

export const enabledNetworks: NetworkSymbol[] = Object.keys(networks) as NetworkSymbol[];

export const mainnets: Network[] = getMainnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);

export const testnets: Network[] = getTestnets().filter(network =>
    enabledNetworks.includes(network.symbol),
);
