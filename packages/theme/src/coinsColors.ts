import { CSSColor } from './types';

export type CoinsColors = Record<string, CSSColor>;

export const coinsColors: CoinsColors = {
    vtc: '#1B9065',
    bch: '#0AC18E',
    etc: '#60C67E',
    xrp: '#24292E',
    dash: '#1796E4',
    dgb: '#3A75C9',
    name: '#2D78A4',
    btg: '#3B5185',
    eth: '#454A75',
    ltc: '#A6A8A9',
    doge: '#C8AF47',
    zec: '#F5B300',
    btc: '#F29937',
    test: '#E75F5F',
    txrp: '#E75F5F',
    gnt: '#8A92B2',
    ada: '#3468D1',
} as const;
