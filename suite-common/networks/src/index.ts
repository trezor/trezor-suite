export {
    createNetworksCompositionRoot,
    type NetworksCompositionRootDeps,
} from './createNetworksCompositionRoot';
export {
    networksReducer,
    networksActions,
    type NetworksState,
    type NetworksRootState,
} from '../reduxState/networksReducer';
export { type NetworkMetadata } from '../reduxState/NetworkMetadata';
export {
    selectNetworkColor,
    selectNetworkNamesMap,
    selectNetworkSymbolForProtocol,
    selectSupportedNetworkSymbols,
} from '../reduxState/networksSelectors';
export { createLoadNetworkModules, type LoadNetworkModulesDep } from './createLoadNetworkModules';
export { createGetNetworkConfigs } from './createGetNetworkConfigs';
export { getLegacyNetworkConfigs, type LegacyNetworkConfigs } from './legacyNetworkConfig';
// Temporary compatibility exports for wallet-config; consumers have not migrated yet.
export {
    TREZOR_CONNECT_BACKENDS,
    type AccountType,
    type BackendOption,
    type BackendType,
    type Explorer,
    type NetworkAccount,
    type NetworkFeature,
    type NetworkType,
    type ServerType,
    type TrezorConnectBackendType,
} from '@trezor/network-module-suite-common-types';
export {
    createGetNetworkConfig,
    type GetNetworkConfig,
    type GetNetworkConfigDep,
    type GetNetworkConfigDeps,
} from './createGetNetworkConfig';
export {
    createNetworkModuleRepository,
    injectNetworkModuleRepository,
    type NetworkModuleRepository,
    type NetworkModuleRepositoryDep,
    type NetworkModuleRepositoryDeps,
} from './NetworkModuleRepository';
export {
    asNetworkSymbol,
    type NetworkSymbol,
    type NetworkModules,
    type StaticNetworkModulesDep,
} from './NetworkModules';

export {
    createAddressValidator,
    injectAddressValidator,
    type AddressValidator,
    type AddressValidatorDep,
    type AddressValidatorDeps,
} from './createAddressValidator';

export {
    createGetNamedAddressSupport,
    injectGetNamedAddressSupport,
    type GetNamedAddressSupport,
    type GetNamedAddressSupportDep,
    type GetNamedAddressSupportDeps,
    type NamedAddressSupport,
    type SymbolNamedAddressResolver,
} from './createGetNamedAddressSupport';

export { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';
export type { NetworksServices, NetworksDep } from './NetworksServices';

export type { Network, Networks } from './Network';
