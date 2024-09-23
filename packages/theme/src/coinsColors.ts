import { NetworkSymbol } from '@suite-common/wallet-config';

import { CSSColor } from './types';

export type CoinsColors = Record<NetworkSymbol, CSSColor>;

export const coinsColors: CoinsColors = {
    ada: '#3468d1',
    bch: '#0ac18e',
    bnb: '#f0b90b',
    btc: '#f29937',
    btg: '#3b5185',
    dash: '#1796e4',
    dgb: '#3a75c9',
    doge: '#c8af47',
    dsol: '#9945ff',
    etc: '#60c67e',
    eth: '#454a75',
    ltc: '#a6a8a9',
    matic: '#7b3fe4',
    nmc: '#186c9d',
    regtest: '#e75f5f',
    sol: '#9945ff',
    tada: '#3468d1',
    test: '#e75f5f',
    thol: '#454a75',
    tsep: '#454a75',
    txrp: '#e75f5f',
    vtc: '#1b9065',
    xrp: '#24292e',
    zec: '#f5b300',
};
