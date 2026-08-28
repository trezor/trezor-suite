import type {
    NetworkTxSimulationResult,
    SolanaMessageScanResponse,
    SolanaValidation,
    StellarTxScanResponse,
    StellarValidation,
    TransactionScanResponse,
} from '../types';
import {
    getEvmSimulationSummary,
    getSolanaAssetDiffs,
    getStellarAssetDiffs,
} from './getSimulationAssetDiffs';

export type TxSimulationValidationFeature = {
    address?: string | null;
    description: string;
    feature_id: string;
    type: 'Benign' | 'Warning' | 'Malicious' | 'Info';
};

export type TxSimulationValidationSummary = {
    riskLevel: 'Malicious' | 'Warning';
    classification?: string;
    reason?: string;
    description?: string;
    features: TxSimulationValidationFeature[];
};

type ValidationLike = {
    result_type: 'Benign' | 'Warning' | 'Malicious' | 'Error';
    classification?: string;
    reason?: string;
    description?: string;
    features: TxSimulationValidationFeature[];
};

const getValidationRiskSummary = (
    validation: ValidationLike | undefined,
): TxSimulationValidationSummary | null => {
    if (validation?.result_type !== 'Malicious' && validation?.result_type !== 'Warning') {
        return null;
    }

    return {
        riskLevel: validation.result_type,
        classification: validation.classification,
        reason: validation.reason,
        description: validation.description,
        features: validation.features,
    };
};

const getEvmValidation = (
    validation: TransactionScanResponse['validation'],
): ValidationLike | undefined =>
    validation && 'features' in validation
        ? { ...validation, features: validation.features ?? [] }
        : undefined;

// Solana's `features` is a plain string list; `extended_features` carries the structured entries.
const getSolanaValidation = (validation: SolanaValidation | null): ValidationLike | undefined =>
    validation ? { ...validation, features: validation.extended_features ?? [] } : undefined;

const getStellarValidation = (
    validation: StellarValidation | null | undefined,
): ValidationLike | undefined => (validation && 'features' in validation ? validation : undefined);

export type TxSimulationFailure = { error: string; description?: string };

// Beyond each network's own error arm, the three readers below share one rule: a scan that answers
// with a success status but no account summary has nothing to show and nothing to trust, so it
// counts as a failure rather than as a transaction that moves no assets.
const SIMULATION_FAILED = 'Simulation failed';

export const getEvmSimulationFailure = (
    response: TransactionScanResponse,
): TxSimulationFailure | null => {
    const { simulation } = response;

    if (simulation?.status === 'Error') {
        return { error: simulation.error, description: simulation.description };
    }

    if (simulation && !getEvmSimulationSummary(response)) {
        return { error: SIMULATION_FAILED };
    }

    return null;
};

// Solana reports transport-level failures on the envelope; its simulation has no status of its own.
export const getSolanaSimulationFailure = (
    response: SolanaMessageScanResponse,
): TxSimulationFailure | null => {
    if (response.status === 'ERROR') {
        return { error: response.error ?? SIMULATION_FAILED };
    }

    // Only Solana can report a validation that itself failed. It needs the same acknowledgement as
    // a failed simulation, and grouping it here is what gives that acknowledgement a banner to
    // live on — without one the disclaimer it demands would have nothing to tick.
    if (response.result?.validation?.result_type === 'Error') {
        return { error: SIMULATION_FAILED };
    }

    if (response.result?.simulation && !getSolanaAssetDiffs(response)) {
        return { error: SIMULATION_FAILED };
    }

    return null;
};

export const getStellarSimulationFailure = (
    response: StellarTxScanResponse,
): TxSimulationFailure | null => {
    const { simulation } = response;

    if (simulation?.status === 'Error') {
        return { error: simulation.error };
    }

    if (simulation && !getStellarAssetDiffs(response)) {
        return { error: SIMULATION_FAILED };
    }

    return null;
};

export type TxSimulationRiskSummary = {
    validationRisk: TxSimulationValidationSummary | null;
    simulationFailure: TxSimulationFailure | null;
};

/**
 * Extract validation risk and simulation failure from a Blockaid transaction scan response.
 */
export const getTxSimulationRiskSummary = (
    result: NetworkTxSimulationResult | undefined,
): TxSimulationRiskSummary => {
    switch (result?.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData':
            return {
                validationRisk: getValidationRiskSummary(
                    getEvmValidation(result.payload.validation),
                ),
                simulationFailure: getEvmSimulationFailure(result.payload),
            };

        case 'solanaSignTransaction':
            return {
                validationRisk: getValidationRiskSummary(
                    getSolanaValidation(result.payload.result?.validation ?? null),
                ),
                simulationFailure: getSolanaSimulationFailure(result.payload),
            };

        case 'stellarSignTransaction':
            return {
                validationRisk: getValidationRiskSummary(
                    getStellarValidation(result.payload.validation),
                ),
                simulationFailure: getStellarSimulationFailure(result.payload),
            };

        default:
            return { validationRisk: null, simulationFailure: null };
    }
};

/**
 * Identity of what the user is being asked to acknowledge, or `null` when nothing is. It changes
 * whenever a rescan starts warning about something else, which is what stops an acceptance given
 * for one problem from silently covering the next.
 */
export const getTxSimulationDisclaimerKey = (
    result: NetworkTxSimulationResult | undefined,
): string | null => {
    if (!result?.payload.needsDisclaimer) {
        return null;
    }

    const { validationRisk, simulationFailure } = getTxSimulationRiskSummary(result);

    return `${simulationFailure?.error ?? ''}|${validationRisk?.riskLevel ?? ''}`;
};
