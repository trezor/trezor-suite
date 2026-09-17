import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

// The keys mirror the DI composition root: when adding a Suite Network Module, name it here and
// create its runtime object where the Suite services are composed.
export type SuiteNetworkModules = {
    bitcoin: SuiteNetworkModule;
    ethereum: SuiteNetworkModule;
    ripple: SuiteNetworkModule;
    cardano: SuiteNetworkModule;
    solana: SuiteNetworkModule;
    stellar: SuiteNetworkModule;
    tron: SuiteNetworkModule;
};

export type StaticSuiteNetworkModulesDep = {
    suiteNetworkModules: SuiteNetworkModules;
};
