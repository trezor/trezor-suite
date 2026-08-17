import type { JsonRpcScanResponse } from '@blockaid/client/resources/evm';

// The SDK inlines a `RoutersEvm*`-prefixed copy of every shared type per endpoint, so this is the
// one place that names them. Everything else in the repo imports the aliases below.
export type TransactionScanResponse = JsonRpcScanResponse;

export type TransactionSimulation = JsonRpcScanResponse.RoutersEvmResponseTransactionSimulation;
export type TransactionSimulationError =
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError;
export type TransactionValidation = JsonRpcScanResponse.RoutersEvmResponseTransactionValidation;

export type TransactionScanFeature = TransactionValidation['features'][number];

export type AccountSummary = TransactionSimulation['account_summary'];
export type EvmAssetDiff = AccountSummary['assets_diffs'][number];
export type EvmAssetExposure = AccountSummary['exposures'][number];

export type InsufficientFundsErrorDetails =
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseGeneralInsufficientFundsErrorDetails;
export type InvalidAddressErrorDetails =
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseGeneralInvalidAddressErrorDetails;
export type UnsupportedEip712MessageErrorDetails =
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError.RoutersEvmResponseUnsupportedEip712MessageErrorDetails;
