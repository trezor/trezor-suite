import type { BitcoinNetworkSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import type { CardanoNetworkSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import type { EthereumNetworkSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common/network-module';
import type { RippleNetworkSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import type { SolanaNetworkSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import type { StellarNetworkSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import type { TronNetworkSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

// When adding a new Network Module, you have to
//    1. register it here to have the static typing
//    2. create the runtime object for DI in `createNetworksCompositionRoot`
export type NetworkModules = {
    bitcoin: BitcoinNetworkSuiteCommonNetworkModule;
    ethereum: EthereumNetworkSuiteCommonNetworkModule;
    ripple: RippleNetworkSuiteCommonNetworkModule;
    cardano: CardanoNetworkSuiteCommonNetworkModule;
    solana: SolanaNetworkSuiteCommonNetworkModule;
    stellar: StellarNetworkSuiteCommonNetworkModule;
    tron: TronNetworkSuiteCommonNetworkModule;
};

export type StaticNetworkModulesDep = {
    networkModules: NetworkModules;
};

// This is a tool that extracts the union type of all supported network symbols
// from the NetworkModules.
//
// With this, we are able to statically type the NetworkSymbol, while
// preserving the modular aspect.
//
type NetworkModuleSymbol<TNetworkModule> = TNetworkModule extends {
    getSupportedNetworks: () => readonly (infer TSymbol)[];
}
    ? TSymbol
    : never;

export type NetworkSymbol = NetworkModuleSymbol<NetworkModules[keyof NetworkModules]>;
