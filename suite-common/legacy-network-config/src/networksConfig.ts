import { networkConfigBySymbol as bitcoinConfigs } from '@trezor/network-bitcoin-suite-common';
import { networkConfigBySymbol as cardanoConfigs } from '@trezor/network-cardano-suite-common';
import { networkConfigBySymbol as ethereumConfigs } from '@trezor/network-ethereum-suite-common';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';
import { networkConfigBySymbol as rippleConfigs } from '@trezor/network-ripple-suite-common';
import { networkConfigBySymbol as solanaConfigs } from '@trezor/network-solana-suite-common';
import { networkConfigBySymbol as stellarConfigs } from '@trezor/network-stellar-suite-common';
import { networkConfigBySymbol as tronConfigs } from '@trezor/network-tron-suite-common';

import type { Network, Networks } from './types';

type LegacyNetworkConfig<TSymbol extends string, TConfig extends SuiteCommonNetworkConfig> = Omit<
    Network,
    'settlementLayer'
> &
    Omit<TConfig, 'yieldXyzId'> & { symbol: TSymbol; yieldXyzId: Network['yieldXyzId'] };

const withSymbol = <TSymbol extends string, TConfig extends SuiteCommonNetworkConfig>(
    symbol: TSymbol,
    config: TConfig,
): LegacyNetworkConfig<TSymbol, TConfig> => ({
    ...config,
    symbol,
    yieldXyzId: config.yieldXyzId as Network['yieldXyzId'],
});

type ModuleConfigs = typeof bitcoinConfigs &
    typeof ethereumConfigs &
    typeof rippleConfigs &
    typeof cardanoConfigs &
    typeof solanaConfigs &
    typeof stellarConfigs &
    typeof tronConfigs;

export type LegacyNetworkConfigs = {
    [Symbol in keyof ModuleConfigs]: LegacyNetworkConfig<Symbol, ModuleConfigs[Symbol]>;
};

// Compatibility for callers still using wallet-config. New consumers select metadata from Redux.
export const networks: LegacyNetworkConfigs = {
    btc: withSymbol('btc', bitcoinConfigs.btc),
    eth: withSymbol('eth', ethereumConfigs.eth),
    pol: withSymbol('pol', ethereumConfigs.pol),
    bsc: withSymbol('bsc', ethereumConfigs.bsc),
    arb: withSymbol('arb', ethereumConfigs.arb),
    base: withSymbol('base', ethereumConfigs.base),
    op: withSymbol('op', ethereumConfigs.op),
    rhc: withSymbol('rhc', ethereumConfigs.rhc),
    hype: withSymbol('hype', ethereumConfigs.hype),
    avax: withSymbol('avax', ethereumConfigs.avax),
    sol: withSymbol('sol', solanaConfigs.sol),
    trx: withSymbol('trx', tronConfigs.trx),
    ada: withSymbol('ada', cardanoConfigs.ada),
    etc: withSymbol('etc', ethereumConfigs.etc),
    xrp: withSymbol('xrp', rippleConfigs.xrp),
    xlm: withSymbol('xlm', stellarConfigs.xlm),
    ltc: withSymbol('ltc', bitcoinConfigs.ltc),
    bch: withSymbol('bch', bitcoinConfigs.bch),
    doge: withSymbol('doge', bitcoinConfigs.doge),
    zec: withSymbol('zec', bitcoinConfigs.zec),
    test: withSymbol('test', bitcoinConfigs.test),
    regtest: withSymbol('regtest', bitcoinConfigs.regtest),
    tsep: withSymbol('tsep', ethereumConfigs.tsep),
    thod: withSymbol('thod', ethereumConfigs.thod),
    dsol: withSymbol('dsol', solanaConfigs.dsol),
    txrp: withSymbol('txrp', rippleConfigs.txrp),
    txlm: withSymbol('txlm', stellarConfigs.txlm),
    ttrx: withSymbol('ttrx', tronConfigs.ttrx),
} satisfies Networks;
