import type { BitcoinNetworkModule } from '@trezor/network-bitcoin-suite';
import type { CardanoNetworkModule } from '@trezor/network-cardano-suite';
import type { EthereumNetworkModule } from '@trezor/network-ethereum-suite';
import type { NetworkModule } from '@trezor/network-module-suite-types';
import type { RippleNetworkModule } from '@trezor/network-ripple-suite';
import type { SolanaNetworkModule } from '@trezor/network-solana-suite';
import type { StellarNetworkModule } from '@trezor/network-stellar-suite';
import type { TronNetworkModule } from '@trezor/network-tron-suite';

// When adding a new Network Module, you have to
//    1. register it here to have the static typing
//    2. create the runtime object for DI in `createNetworksCompositionRoot`
export type NetworkModules = {
    bitcoin: BitcoinNetworkModule;
    ethereum: EthereumNetworkModule;
    ripple: RippleNetworkModule;
    cardano: CardanoNetworkModule;
    solana: SolanaNetworkModule;
    stellar: StellarNetworkModule;
    tron: TronNetworkModule;
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
type NetworkModuleSymbol<TNetworkModule> =
    TNetworkModule extends NetworkModule<infer TSymbol> ? TSymbol : never;

export type NetworkSymbol = NetworkModuleSymbol<NetworkModules[keyof NetworkModules]>;
