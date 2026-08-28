import type { JsonRpcScanResponse } from '@blockaid/client/resources/evm';
import type { MessageScanResponse } from '@blockaid/client/resources/solana/message';
import type { StellarTransactionScanResponse } from '@blockaid/client/resources/stellar';

import { type OptionalKey } from '@trezor/type-utils';

// The SDK inlines a `RoutersEvm*`-prefixed copy of every shared type per endpoint, so this is the
// one place that names them. Everything else in the repo imports the aliases below.
//
// Every network's `account_summary` is widened to optional on the way through. The generated SDK
// types mark it required, but a scan whose simulation half degraded — an expired Solana blockhash
// on a refetch, say — still answers with a success status and no summary at all. Widening it here
// is what makes the compiler point at each read instead of leaving it to be found at runtime.

type EvmSimulation = OptionalKey<
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulation,
    'account_summary'
>;

export type TransactionScanResponse = Omit<JsonRpcScanResponse, 'simulation'> & {
    simulation?: EvmSimulation | JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError;
};

export type TransactionSimulation = EvmSimulation;
export type TransactionSimulationError =
    JsonRpcScanResponse.RoutersEvmResponseTransactionSimulationError;
export type TransactionValidation = JsonRpcScanResponse.RoutersEvmResponseTransactionValidation;

export type TransactionScanFeature = TransactionValidation['features'][number];

export type AccountSummary = NonNullable<TransactionSimulation['account_summary']>;
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
export type SolanaSimulation = OptionalKey<
    NonNullable<MessageScanResponse.Result['simulation']>,
    'account_summary'
>;

export type SolanaMessageScanResponse = Omit<MessageScanResponse, 'result'> & {
    result?:
        | (Omit<MessageScanResponse.Result, 'simulation'> & {
              simulation: SolanaSimulation | null;
          })
        | null;
};

export type SolanaValidation = NonNullable<MessageScanResponse.Result['validation']>;

type StellarSimulationSuccess = Extract<
    NonNullable<StellarTransactionScanResponse['simulation']>,
    { status: 'Success' }
>;
type StellarSimulationError = Extract<
    NonNullable<StellarTransactionScanResponse['simulation']>,
    { status: 'Error' }
>;

export type StellarSimulation = OptionalKey<StellarSimulationSuccess, 'account_summary'>;

export type StellarTxScanResponse = Omit<StellarTransactionScanResponse, 'simulation'> & {
    simulation?: StellarSimulation | StellarSimulationError | null;
};

export type StellarValidation = NonNullable<StellarTransactionScanResponse['validation']>;
export type StellarAccountSummary = NonNullable<StellarSimulation['account_summary']>;
export type StellarAssetDiff = NonNullable<StellarAccountSummary['account_assets_diffs']>[number];

export type SolanaAccountSummary = NonNullable<SolanaSimulation['account_summary']>;
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
