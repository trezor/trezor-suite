import type { BitcoinNetworkSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import type { CardanoNetworkSuiteNetworkModule } from '@trezor/network-cardano-suite';
import type { EthereumNetworkSuiteNetworkModule } from '@trezor/network-ethereum-suite';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

export type SuiteNetworkModules = {
    bitcoin: BitcoinNetworkSuiteNetworkModule;
    ethereum: EthereumNetworkSuiteNetworkModule;
    cardano: CardanoNetworkSuiteNetworkModule;
};

type SuiteNetworkModuleSymbol<TNetworkModule> =
    TNetworkModule extends SuiteNetworkModule<infer TSymbol> ? TSymbol : never;

export type SuiteNetworkSymbol = SuiteNetworkModuleSymbol<
    SuiteNetworkModules[keyof SuiteNetworkModules]
>;

export type StaticSuiteNetworkModulesDep = {
    suiteNetworkModules: SuiteNetworkModules;
};
