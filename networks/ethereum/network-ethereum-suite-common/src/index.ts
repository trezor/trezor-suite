export { createEthereumSuiteCommonNetworkModule } from './createEthereumSuiteCommonNetworkModule';

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isNativeTokenWrappable,
    isWrappedNativeToken,
} from './wrappedNativeToken';

export { networkConfigBySymbol } from './networkConfig';

export { Calldata } from './calldata/calldata';
export { Verifier } from './calldata/verifier';
export { EVM_ABI } from './calldata/constants/evm';
export { type EvmAddress, asEvmAddress } from './calldata/types/evm';
export type { VerifyIssue } from './calldata/types/verifier';
export {
    isEvmClearSigningTx,
    getEvmClearSignedSwapCoverage,
    type ClearSigningCoverage,
} from './calldata/clearSigning';
export {
    decodeClearSignedSwap,
    NATIVE_CURRENCY,
    type DecodedClearSignedSwap,
    type ClearSignedSwapLeg,
} from './calldata/clearSigningSwap';
