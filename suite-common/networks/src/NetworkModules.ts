import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

/**
 * The symbol is intentionally open: it is a branded string, not a union derived from the
 * registered modules. A network family should be added by registering its module, without a
 * central type having to enumerate every symbol it may contribute.
 */
export { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module/constants';

// When adding a new Network Module, you have to
//    1. register it here to have the static typing
//    2. create the runtime object for DI in `createNetworkModulesCompositionRoot`
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
