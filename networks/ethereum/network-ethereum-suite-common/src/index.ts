export { createEthereumSuiteCommonNetworkModule } from './createEthereumSuiteCommonNetworkModule';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';
export { getNativeErc20Token } from './nativeErc20Token';

export { networkConfigBySymbol } from './networkConfig';
