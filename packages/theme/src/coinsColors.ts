import { CSSColor } from './types';

export type CoinsColors = Record<string, CSSColor>;

export const coinsColors: CoinsColors = {
    ada: '#3468D1',
    bch: '#0AC18E',
    btc: '#F29937',
    btg: '#3B5185',
    dash: '#1796E4',
    dgb: '#3A75C9',
    doge: '#C8AF47',
    etc: '#60C67E',
    eth: '#454A75',
    gnt: '#8A92B2',
    ltc: '#A6A8A9',
    matic: '#7b3fe4',
    name: '#2D78A4',
    test: '#E75F5F',
    txrp: '#E75F5F',
    vtc: '#1B9065',
    xrp: '#24292E',
    zec: '#F5B300',
} as const;
