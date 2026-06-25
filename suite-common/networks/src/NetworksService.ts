import type { BitcoinNetworkModule } from '@network-module/bitcoin-suite';
import type { CardanoNetworkModule } from '@network-module/cardano-suite';
import type { EthereumNetworkModule } from '@network-module/ethereum-suite';
import type { RippleNetworkModule } from '@network-module/ripple-suite';
import type { SolanaNetworkModule } from '@network-module/solana-suite';
import type { StellarNetworkModule } from '@network-module/stellar-suite';
import type { NetworkModule } from '@network-module/suite-types';
import type { TronNetworkModule } from '@network-module/tron-suite';

// When adding a new Network Module, you have to
//    1. register it here to have the static typing
//    2. create the runtime object for DI in `createNetworksCompositionRoot`
export type StaticNetworkModules = {
    bitcoin: BitcoinNetworkModule;
    ethereum: EthereumNetworkModule;
    ripple: RippleNetworkModule;
    cardano: CardanoNetworkModule;
    solana: SolanaNetworkModule;
    stellar: StellarNetworkModule;
    tron: TronNetworkModule;
};

type StaticNetworkModuleCoinSymbol<TNetworkModule> =
    TNetworkModule extends NetworkModule<infer TSymbol> ? TSymbol : never;

export type CoinSymbol = StaticNetworkModuleCoinSymbol<
    StaticNetworkModules[keyof StaticNetworkModules]
>;

export type NetworksService = {
    networkModules: StaticNetworkModules;
};

export type NetworksServiceDep = {
    networks: NetworksService;
};
