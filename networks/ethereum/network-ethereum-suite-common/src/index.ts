export { createEthereumSuiteCommonNetworkModule } from './EthereumNetworkSuiteCommonNetworkModule';
export type { EthereumNetworkSuiteCommonNetworkModule } from './EthereumNetworkSuiteCommonNetworkModule';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';
