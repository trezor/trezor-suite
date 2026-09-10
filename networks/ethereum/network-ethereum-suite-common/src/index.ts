export { createEthereumSuiteCommonNetworkModule } from './createEthereumSuiteCommonNetworkModule';
export type { EthereumNetworkSuiteCommonNetworkModule } from './createEthereumSuiteCommonNetworkModule';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';
