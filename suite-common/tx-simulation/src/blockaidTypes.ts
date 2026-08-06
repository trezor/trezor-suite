// @blockaid/client v1.x moved the EVM json-rpc scan types into deeply nested,
// codegen-named namespaces under `JsonRpcScanResponse` (e.g.
// `RoutersEvmResponseTransactionSimulation`). This module centralizes those
// paths behind the stable names the rest of the package (and its consumers)
// use, so the churn is confined to a single file.
import type { JsonRpcScanResponse as Scan } from '@blockaid/client/resources/evm';

/** Response of `client.evm.jsonRpc.scan(...)`. */
export type TransactionScanResponse = Scan;

export type TransactionSimulation = Scan.RoutersEvmResponseTransactionSimulation;
export type TransactionSimulationError = Scan.RoutersEvmResponseTransactionSimulationError;
export type TransactionValidation = Scan.RoutersEvmResponseTransactionValidation;
export type TransactionScanFeature = Scan.RoutersEvmResponseTransactionValidation.Feature;

/** Account summary interface nested in a successful simulation. */
export type AccountSummary = Scan.RoutersEvmResponseTransactionSimulation.AccountSummary;

export type EvmAssetDiff =
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc20AddressAssetBalanceChangeDiff
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc721AddressAssetBalanceChangeDiff
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc1155AddressAssetBalanceChangeDiff
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseNativeAddressAssetBalanceChangeDiff;

export type EvmAssetExposure =
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc20AddressExposure
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc721AddressExposure
    | Scan.RoutersEvmResponseTransactionSimulation.AccountSummary.RoutersEvmResponseErc1155AddressExposure;

export type GeneralInsufficientFundsErrorDetails =
    Scan.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseGeneralInsufficientFundsErrorDetails;
export type GeneralInvalidAddressErrorDetails =
    Scan.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseGeneralInvalidAddressErrorDetails;
export type UnsupportedEip712MessageErrorDetails =
    Scan.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseUnsupportedEip712MessageErrorDetails;
