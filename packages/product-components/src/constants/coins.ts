import { type NetworkSymbol } from '@suite-common/wallet-config';

// These coins are not supported in Suite, but exist in Trezor Connect
export type LegacyNetworkSymbol =
    | 'xtz'
    | 'dash'
    | 'dgb'
    | 'nmc'
    | 'vtc'
    | 'btg'
    | 'xmr'
    | 'tada'
    // not 'legacy', but not supported yet in Suite
    | 'trx';

export const COINS: Record<NetworkSymbol | LegacyNetworkSymbol, string> = {
    ada: require('../images/coins/ada.svg'),
    arb: require('../images/coins/arb.svg'),
    avax: require('../images/coins/avax.svg'),
    base: require('../images/coins/base.svg'),
    bch: require('../images/coins/bch.svg'),
    bsc: require('../images/coins/bsc.svg'),
    btc: require('../images/coins/btc.svg'),
    btg: require('../images/coins/btg.svg'),
    dash: require('../images/coins/dash.svg'),
    dgb: require('../images/coins/dgb.svg'),
    doge: require('../images/coins/doge.svg'),
    dsol: require('../images/coins/dsol.svg'),
    etc: require('../images/coins/etc.svg'),
    eth: require('../images/coins/eth.svg'),
    ltc: require('../images/coins/ltc.svg'),
    op: require('../images/coins/op.svg'),
    pol: require('../images/coins/pol.svg'),
    nmc: require('../images/coins/nmc.svg'),
    regtest: require('../images/coins/btc_test.svg'),
    sol: require('../images/coins/sol.svg'),
    tada: require('../images/coins/tada.svg'),
    test: require('../images/coins/btc_test.svg'),
    thod: require('../images/coins/thod.svg'),
    trx: require('../images/coins/trx.svg'),
    ttrx: require('../images/coins/ttrx.svg'),
    tsep: require('../images/coins/tsep.svg'),
    txlm: require('../images/coins/txlm.svg'),
    txrp: require('../images/coins/txrp.svg'),
    vtc: require('../images/coins/vtc.svg'),
    xlm: require('../images/coins/xlm.svg'),
    xmr: require('../images/coins/xmr.svg'),
    xrp: require('../images/coins/xrp.svg'),
    xtz: require('../images/coins/xtz.svg'),
    zec: require('../images/coins/zec.svg'),
};

export const isCoinSymbol = (
    coinSymbol: string,
): coinSymbol is NetworkSymbol | LegacyNetworkSymbol => Object.hasOwn(COINS, coinSymbol);
