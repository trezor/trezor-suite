import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

export { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

export type NetworkModules = readonly SuiteCommonNetworkModule[];

export type StaticNetworkModulesDep = {
    networkModules: NetworkModules;
};
