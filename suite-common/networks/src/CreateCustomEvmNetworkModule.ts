import type {
    SuiteCommonNetworkConfig,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';

export type CreateCustomEvmNetworkModuleParams = {
    symbol: NetworkSymbol;
    config: SuiteCommonNetworkConfig;
};

/**
 * Builds the module of a user-added EVM network. Supplied by the application root, which owns the
 * network modules, so this package never depends on one.
 */
export type CreateCustomEvmNetworkModule = (
    params: CreateCustomEvmNetworkModuleParams,
) => SuiteCommonNetworkModule;

export type CreateCustomEvmNetworkModuleDep = {
    createCustomEvmNetworkModule: CreateCustomEvmNetworkModule;
};
