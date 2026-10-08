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

type LegacyNetworkConfigsOf<TConfigs extends Record<string, SuiteCommonNetworkConfig>> = {
    [Symbol in keyof TConfigs & string]: LegacyNetworkConfig<Symbol, TConfigs[Symbol]>;
};

// Every network a family package configures, keyed by symbol: a network added there needs no edit here.
const withSymbols = <TConfigs extends Record<string, SuiteCommonNetworkConfig>>(
    configs: TConfigs,
): LegacyNetworkConfigsOf<TConfigs> =>
    Object.fromEntries(
        Object.entries(configs).map(([symbol, config]) => [symbol, withSymbol(symbol, config)]),
    ) as LegacyNetworkConfigsOf<TConfigs>;

// Compatibility for callers still using wallet-config. New consumers select metadata from Redux.
export const networks: LegacyNetworkConfigs = {
    ...withSymbols(bitcoinConfigs),
    ...withSymbols(ethereumConfigs),
    ...withSymbols(solanaConfigs),
    ...withSymbols(tronConfigs),
    ...withSymbols(cardanoConfigs),
    ...withSymbols(rippleConfigs),
    ...withSymbols(stellarConfigs),
} satisfies Networks;

export type LegacyNetworkSymbol = keyof typeof networks;
