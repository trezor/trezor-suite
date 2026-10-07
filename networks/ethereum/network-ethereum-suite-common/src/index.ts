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

export {
    fromBigInt,
    fromEther,
    fromGwei,
    fromHex,
    fromIntegerString,
    fromWei,
} from './chain/send/evm/ethConverter';
export type {
    DecimalString,
    Ether,
    Gwei,
    HexString,
    IntegerString,
    Wei,
} from './chain/send/evm/ethereumUnits';
export {
    ERC20_TRANSFER,
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from './chain/send/evm/evmConstants';
export {
    isEip1559,
    isEvmApprovalTx,
    padLeftEven,
    sanitizeHex,
    strip,
} from './chain/send/evm/evmHex';
export {
    getSignatureByEthereumDataHex,
    getTxStakeNameByDataHex,
    isClaimTx,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
    signatureToStakeTypeMap,
} from './chain/send/evm/evmStaking';
export type { EvmStakeType } from './chain/send/evm/evmStaking';
export {
    calculateTotalGasCost,
    getApprovalComposeOutput,
    getEthereumEstimateFeeParams,
    prepareEthereumTransaction,
} from './chain/send/evm/evmTransaction';
export type { EthTransactionData } from './chain/send/evm/evmTransaction';
export { createEthereumChainSend } from './chain/send/createEthereumChainSend';
export type {
    EthereumChainSend,
    EthereumChainSendDeps,
} from './chain/send/createEthereumChainSend';
export { calculateEvmTransfer } from './chain/send/calculateEvmTransfer';
export type { EvmMaxReserve } from './chain/send/calculateEvmTransfer';
export type {
    EvmFeeEstimationFailure,
    EvmSendAppDeps,
    ResolveEvmNonceParams,
    ResolvedEvmNonce,
} from './chain/send/types';
