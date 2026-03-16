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

export const NETWORK_ICONS = {
    ada: require('../images/networks/ada.svg'),
    arb: require('../images/networks/arb.svg'),
    avax: require('../images/networks/avax.svg'),
    base: require('../images/networks/base.svg'),
    bch: require('../images/networks/bch.svg'),
    bsc: require('../images/networks/bsc.svg'),
    btc: require('../images/networks/btc.svg'),
    doge: require('../images/networks/doge.svg'),
    dsol: require('../images/networks/dsol.svg'),
    etc: require('../images/networks/etc.svg'),
    eth: require('../images/networks/eth.svg'),
    ltc: require('../images/networks/ltc.svg'),
    op: require('../images/networks/op.svg'),
    pol: require('../images/networks/pol.svg'),
    regtest: require('../images/networks/btc_test.svg'),
    sol: require('../images/networks/sol.svg'),
    tada: require('../images/networks/tada.svg'),
    test: require('../images/networks/btc_test.svg'),
    thod: require('../images/networks/thod.svg'),
    trx: require('../images/networks/trx.svg'),
    tsep: require('../images/networks/tsep.svg'),
    txlm: require('../images/networks/txlm.svg'),
    txrp: require('../images/networks/txrp.svg'),
    xrp: require('../images/networks/xrp.svg'),
    zec: require('../images/networks/zec.svg'),
    xlm: require('../images/networks/xlm.svg'),
    xtz: require('../images/networks/xtz.svg'),
    dash: require('../images/networks/dash.svg'),
    dgb: require('../images/networks/dgb.svg'),
    nmc: require('../images/networks/nmc.svg'),
    vtc: require('../images/networks/vtc.svg'),
    btg: require('../images/networks/btg.svg'),
    xmr: require('../images/networks/xmr.svg'),
} as const satisfies Record<NetworkSymbol | LegacyNetworkSymbol, string>;

export const isNetworkSymbolWithIcon = (
    networkSymbol: string,
): networkSymbol is NetworkSymbol | LegacyNetworkSymbol =>
    Object.hasOwn(NETWORK_ICONS, networkSymbol);
