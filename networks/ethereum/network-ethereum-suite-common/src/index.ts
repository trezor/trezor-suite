export { createEthereumSuiteCommonNetworkModule } from './createEthereumSuiteCommonNetworkModule';

export { createEthereumBlockbookChainNetwork } from './chain/createEthereumBlockbookChainNetwork';
export type { EthereumBlockbookChainNetworkDeps } from './chain/createEthereumBlockbookChainNetwork';
export { createEthereumCustomRpcChainNetwork } from './chain/createEthereumCustomRpcChainNetwork';
export type { EthereumCustomRpcChainNetworkDeps } from './chain/createEthereumCustomRpcChainNetwork';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';

export { networkConfigBySymbol } from './networkConfig';
