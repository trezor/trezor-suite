import type { JsonRpcScanResponse } from '@blockaid/client/resources/evm';
import type { MessageScanResponse } from '@blockaid/client/resources/solana/message';
import type { StellarTransactionScanResponse } from '@blockaid/client/resources/stellar';

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

// Solana returns a different envelope: everything sits under `result`, and the transport-level
// outcome is the top-level `status` rather than `simulation.status`.
export type SolanaMessageScanResponse = MessageScanResponse;

export type SolanaSimulation = NonNullable<MessageScanResponse.Result['simulation']>;
export type SolanaValidation = NonNullable<MessageScanResponse.Result['validation']>;

export type StellarTxScanResponse = StellarTransactionScanResponse;
export type StellarSimulation = Extract<
    NonNullable<StellarTransactionScanResponse['simulation']>,
    { status: 'Success' }
>;
export type StellarValidation = NonNullable<StellarTransactionScanResponse['validation']>;
export type StellarAssetDiff = NonNullable<
    StellarSimulation['account_summary']['account_assets_diffs']
>[number];

export type SolanaAccountSummary = SolanaSimulation['account_summary'];
export type SolanaAssetDiff = NonNullable<SolanaAccountSummary['account_assets_diff']>[number];

type TxSimulationCommonResult = { needsDisclaimer: boolean };

export type TxSimulationEVMResult = TransactionScanResponse & TxSimulationCommonResult;
export type TxSimulationSolanaResult = SolanaMessageScanResponse & TxSimulationCommonResult;
export type TxSimulationStellarResult = StellarTxScanResponse & TxSimulationCommonResult;

export type NetworkTxSimulationResult =
    | { method: 'ethereumSignTransaction'; payload: TxSimulationEVMResult }
    | { method: 'ethereumSignTypedData'; payload: TxSimulationEVMResult }
    | { method: 'solanaSignTransaction'; payload: TxSimulationSolanaResult }
    | { method: 'stellarSignTransaction'; payload: TxSimulationStellarResult };
