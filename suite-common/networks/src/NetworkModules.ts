import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

export { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

// The keys mirror the DI composition root: when adding a Network Module, name it here and create
// its runtime object in `createNetworkModulesCompositionRoot`.
export type NetworkModules = {
    bitcoin: SuiteCommonNetworkModule;
    ethereum: SuiteCommonNetworkModule;
    ripple: SuiteCommonNetworkModule;
    cardano: SuiteCommonNetworkModule;
    solana: SuiteCommonNetworkModule;
    stellar: SuiteCommonNetworkModule;
    tron: SuiteCommonNetworkModule;
};

export type StaticNetworkModulesDep = {
    networkModules: NetworkModules;
};
