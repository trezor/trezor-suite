import type {
    NetworkTxSimulationResult,
    SolanaValidation,
    StellarValidation,
    TransactionScanResponse,
} from '../types';

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
        case 'ethereumSignTypedData': {
            const { validation, simulation } = result.payload;

            return {
                validationRisk: getValidationRiskSummary(getEvmValidation(validation)),
                simulationFailure:
                    simulation?.status === 'Error'
                        ? { error: simulation.error, description: simulation.description }
                        : null,
            };
        }

        case 'solanaSignTransaction': {
            const { status, error, result: scanResult } = result.payload;

            return {
                validationRisk: getValidationRiskSummary(
                    getSolanaValidation(scanResult?.validation ?? null),
                ),
                // Solana has no per-simulation status; a failed scan is reported on the envelope.
                simulationFailure:
                    status === 'ERROR' ? { error: error ?? 'Simulation failed' } : null,
            };
        }

        case 'stellarSignTransaction': {
            const { validation, simulation } = result.payload;

            return {
                validationRisk: getValidationRiskSummary(getStellarValidation(validation)),
                simulationFailure:
                    simulation?.status === 'Error' ? { error: simulation.error } : null,
            };
        }

        default:
            return { validationRisk: null, simulationFailure: null };
    }
};
