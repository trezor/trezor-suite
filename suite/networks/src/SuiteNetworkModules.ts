import type { BitcoinSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import type { CardanoSuiteNetworkModule } from '@trezor/network-cardano-suite';
import type { EthereumSuiteNetworkModule } from '@trezor/network-ethereum-suite';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import type { RippleSuiteNetworkModule } from '@trezor/network-ripple-suite';
import type { SolanaSuiteNetworkModule } from '@trezor/network-solana-suite';
import type { StellarSuiteNetworkModule } from '@trezor/network-stellar-suite';
import type { TronSuiteNetworkModule } from '@trezor/network-tron-suite';

// When adding a new Suite Network Module, you have to
//    1. register it here to have the static typing
//    2. create the runtime object for DI where the Suite services are composed
export type SuiteNetworkModules = {
    bitcoin: BitcoinSuiteNetworkModule;
    ethereum: EthereumSuiteNetworkModule;
    cardano: CardanoSuiteNetworkModule;
    ripple: RippleSuiteNetworkModule;
    solana: SolanaSuiteNetworkModule;
    stellar: StellarSuiteNetworkModule;
    tron: TronSuiteNetworkModule;
};

export type StaticSuiteNetworkModulesDep = {
    suiteNetworkModules: SuiteNetworkModules;
};

type SuiteNetworkModuleSymbol<TNetworkModule> =
    TNetworkModule extends SuiteNetworkModule<infer TSymbol> ? TSymbol : never;

export type SuiteNetworkSymbol = SuiteNetworkModuleSymbol<
    SuiteNetworkModules[keyof SuiteNetworkModules]
>;
