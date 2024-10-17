import { NetworkSymbol } from '@suite-common/wallet-config';

export type Protocol =
    | 'bitcoin'
    | 'btc'
    | 'litecoin'
    | 'bitcoincash'
    | 'bitcoingold'
    | 'dash'
    | 'digibyte'
    | 'dogecoin'
    | 'namecoin'
    | 'vertcoin'
    | 'zcash'
    | 'ethereum'
    | 'ethclassic'
    | 'ripple'
    | 'cardano'
    | 'solana'
    | 'matic'
    | 'polygon'
    | 'binance'
    | 'optimism'
    | 'test'
    | 'regtest'
    | 'ltc'
    | 'bch'
    | 'bsc'
    | 'btg'
    | 'dgb'
    | 'doge'
    | 'nmc'
    | 'vtc'
    | 'zec'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'ada'
    | 'sol'
    | 'pol'
    | 'bnb'
    | 'op'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'thol'
    | 'txrp'
    | 'tada'
    | 'dsol';

export const NETWORK_TO_PROTOCOLS: { [key in NetworkSymbol]: Protocol[] } = {
    btc: ['bitcoin', 'btc'],
    ltc: ['litecoin', 'ltc'],
    bch: ['bitcoincash', 'bch'],
    btg: ['bitcoingold', 'btg'],
    dash: ['dash'],
    dgb: ['digibyte', 'dgb'],
    doge: ['dogecoin', 'doge'],
    nmc: ['namecoin', 'nmc'],
    vtc: ['vertcoin', 'vtc'],
    zec: ['zcash', 'zec'],
    eth: ['ethereum', 'eth'],
    etc: ['ethclassic', 'etc'],
    xrp: ['ripple', 'xrp'],
    ada: ['cardano', 'ada'],
    sol: ['solana', 'sol'],
    pol: ['polygon', 'matic', 'pol'],
    bnb: ['binance', 'bnb', 'bsc'],
    op: ['optimism', 'op'],
    test: ['test'],
    regtest: ['regtest'],
    tsep: ['tsep'],
    thol: ['thol'],
    txrp: ['txrp'],
    tada: ['tada'],
    dsol: ['dsol'],
};
