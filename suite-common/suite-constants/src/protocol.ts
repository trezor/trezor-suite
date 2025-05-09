import { NetworkSymbol } from '@suite-common/wallet-config';

export type Protocol =
    | 'bitcoin'
    | 'btc'
    | 'litecoin'
    | 'bitcoincash'
    | 'dogecoin'
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
    | 'stellar'
    | 'test'
    | 'regtest'
    | 'ltc'
    | 'bch'
    | 'bsc'
    | 'bnb'
    | 'doge'
    | 'zec'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'ada'
    | 'sol'
    | 'pol'
    | 'bsc'
    | 'arbitrum'
    | 'arbitrum-one'
    | 'arb'
    | 'arbitrum-ethereum'
    | 'base'
    | 'op'
    | 'xlm'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'thol'
    | 'txrp'
    | 'tada'
    | 'dsol';

export const NETWORK_TO_PROTOCOLS: Record<NetworkSymbol, Protocol[]> = {
    btc: ['bitcoin', 'btc'],
    ltc: ['litecoin', 'ltc'],
    bch: ['bitcoincash', 'bch'],
    doge: ['dogecoin', 'doge'],
    zec: ['zcash', 'zec'],
    eth: ['ethereum', 'eth'],
    etc: ['ethclassic', 'etc'],
    xrp: ['ripple', 'xrp'],
    ada: ['cardano', 'ada'],
    sol: ['solana', 'sol'],
    pol: ['polygon', 'matic', 'pol'],
    bsc: ['binance', 'bnb', 'bsc'],
    arb: ['arbitrum', 'arbitrum-one', 'arb', 'arbitrum-ethereum'],
    base: ['base'],
    op: ['optimism', 'op'],
    test: ['test'],
    regtest: ['regtest'],
    tsep: ['tsep'],
    thol: ['thol'],
    txrp: ['txrp'],
    tada: ['tada'],
    dsol: ['dsol'],
    xlm: ['stellar', 'xlm'],
};
