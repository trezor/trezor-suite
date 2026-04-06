import { type NetworkSymbol } from '@suite-common/wallet-config';

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
    | 'avax'
    | 'avalanche'
    | 'xlm'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'thod'
    | 'txrp'
    | 'txlm'
    | 'dsol'
    | 'tron'
    | 'trx'
    | 'ttrx';

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
    trx: ['tron', 'trx'],
    ttrx: ['ttrx'],
    pol: ['polygon', 'matic', 'pol'],
    bsc: ['binance', 'bnb', 'bsc'],
    arb: ['arbitrum', 'arbitrum-one', 'arb', 'arbitrum-ethereum'],
    base: ['base'],
    op: ['optimism', 'op'],
    avax: ['avalanche', 'avax'],
    test: ['test'],
    regtest: ['regtest'],
    tsep: ['tsep'],
    thod: ['thod'],
    txrp: ['txrp'],
    dsol: ['dsol'],
    xlm: ['stellar', 'xlm'],
    txlm: ['txlm'],
};
