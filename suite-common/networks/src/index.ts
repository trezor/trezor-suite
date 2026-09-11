export { createNetworksCompositionRoot } from './createNetworksCompositionRoot';
export {
    networksReducer,
    networksActions,
    type NetworksState,
    type NetworksRootState,
} from '../reduxState/networksReducer';
export { type NetworkMetadata } from '../reduxState/NetworkMetadata';
export {
    selectNetworkColor,
    selectNetworkSymbolForProtocol,
    selectSupportedNetworkSymbols,
} from '../reduxState/networksSelectors';
export { createLoadNetworkModules, type LoadNetworkModulesDep } from './createLoadNetworkModules';
export { createGetNetworkConfigs } from './createGetNetworkConfigs';
export {
    getLegacyNetworkConfigs,
    type LegacyNetworkConfigs,
    type Network,
    type Networks,
} from './legacyNetworkConfig';
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
} from '@suite-common/legacy-network-config';
export {
    createGetNetworkConfig,
    type GetNetworkConfig,
    type GetNetworkConfigDep,
    type GetNetworkConfigDeps,
} from './createGetNetworkConfig';
export {
    createNetworkModuleRepository,
    selectNetworkModuleRepositoryDep,
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
