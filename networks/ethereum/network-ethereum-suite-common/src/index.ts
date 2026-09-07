export {
    createEthereumSuiteCommonNetworkModule,
    type EthereumNetworkSuiteCommonNetworkModule,
} from './createEthereumSuiteCommonNetworkModule';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';

// These exports bridge transaction simulation during modularization. Once that feature is owned
// by the Ethereum network module, its Blockaid configuration shall become module-private.
export { findEthereumNetworkSymbolByBlockaidChain, resolveBlockaidEvmChain } from './blockaid';
