// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type CSSColor } from './types';

export type CoinsColors = Record<NetworkSymbol, CSSColor>;

export const coinsColors: CoinsColors = {
    ada: '#3468d1',
    arb: '#213147',
    base: '#0052ff',
    bch: '#0ac18e',
    bsc: '#f0b90b',
    btc: '#f29937',
    doge: '#c8af47',
    dsol: '#9945ff',
    etc: '#60c67e',
    eth: '#454a75',
    ltc: '#a6a8a9',
    op: '#ff0720',
    avax: '#e84142',
    pol: '#7b3fe4',
    regtest: '#e75f5f',
    sol: '#9945ff',
    trx: '#ec002a',
    test: '#e75f5f',
    thod: '#454a75',
    tsep: '#454a75',
    txlm: '#e75f5f',
    txrp: '#e75f5f',
    xrp: '#24292e',
    zec: '#f5b300',
    xlm: '#000000',
};
