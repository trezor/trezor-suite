import {
    networks,
    NetworkSymbol,
    Network,
    getTestnets,
    getMainnets,
} from '@suite-common/wallet-config';

export const mainnetsPriority = {
    btc: 1,
    eth: 2,
    ltc: 3,
    doge: 4,
    etc: 5,
    ada: 6,
    bch: 7,
    xrp: 8,
    dash: 9,
    zec: 10,
    btg: 11,
    vtc: 12,
    nmc: 13,
    dgb: 14,
};

export const testnetsPriority = {
    test: 1,
    regtest: 2,
    tgor: 3,
    trop: 4,
    tada: 5,
    txrp: 6,
};

export const enabledNetworks: NetworkSymbol[] = Object.keys(networks) as NetworkSymbol[];

export const mainnets: Network[] = getMainnets();

export const testnets: Network[] = getTestnets();
