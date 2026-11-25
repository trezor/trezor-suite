export {
    type EthereumSuiteCommonNetworkModule,
    type EthereumSuiteCommonNetworkModuleDeps,
    createEthereumSuiteCommonNetworkModule,
} from './createEthereumSuiteCommonNetworkModule';

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

export { LidoContractReads, type LidoWithdrawalRequestStatus } from './lido/lidoContractReads';
export {
    getLidoDeployment,
    LIDO_MAX_STETH_WITHDRAWAL_AMOUNT,
    LIDO_MIN_STETH_WITHDRAWAL_AMOUNT,
    LIDO_REFERRAL_ADDRESS,
    LIDO_WITHDRAWAL_NFT,
    type LidoDeployment,
} from './lido/lidoDeployments';

export {
    createSignEthereumMessage,
    injectSignEthereumMessage,
    type SignEthereumMessage,
    type SignEthereumMessageDep,
    type SignEthereumMessageDeps,
    type SignEthereumMessageParams,
} from './signVerify/createSignEthereumMessage';
export {
    createVerifyEthereumMessage,
    injectVerifyEthereumMessage,
    type VerifyEthereumMessage,
    type VerifyEthereumMessageDep,
    type VerifyEthereumMessageDeps,
    type VerifyEthereumMessageParams,
} from './signVerify/createVerifyEthereumMessage';
