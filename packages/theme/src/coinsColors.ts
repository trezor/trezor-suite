import { CSSColor } from './types';

export type CoinsColors = Record<string, CSSColor>;

export const coinsColors: CoinsColors = {
    ada: '#3468d1',
    bch: '#0ac18e',
    btc: '#f29937',
    btg: '#3b5185',
    dash: '#1796e4',
    dgb: '#3a75c9',
    doge: '#c8af47',
    etc: '#60c67e',
    eth: '#454a75',
    gnt: '#8a92b2',
    ltc: '#a6a8a9',
    matic: '#7b3fe4',
    name: '#2d78a4',
    test: '#e75f5f',
    txrp: '#e75f5f',
    vtc: '#1b9065',
    xrp: '#24292e',
    zec: '#f5b300',
} as const;
