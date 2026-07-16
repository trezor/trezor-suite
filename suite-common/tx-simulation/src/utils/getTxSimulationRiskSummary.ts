import type {
    TransactionScanFeature,
    TransactionScanResponse,
    TransactionSimulationError,
    TransactionValidation,
} from '@blockaid/client/resources/evm';

export type TxSimulationValidationSummary = {
    riskLevel: Extract<TransactionValidation['result_type'], 'Malicious' | 'Warning'>;
    classification?: string;
    reason?: string;
    description?: string;
    features: TransactionScanFeature[];
};

const getValidationRiskSummary = (
    validation: TransactionScanResponse['validation'],
): TxSimulationValidationSummary | null => {
    if (validation?.result_type !== 'Malicious' && validation?.result_type !== 'Warning') {
        return null;
    }

    return {
        riskLevel: validation.result_type,
        classification: validation.classification,
        reason: validation.reason,
        description: validation.description,
        features: validation.features ?? [],
    };
};

const getSimulationFailureSummary = (
    simulation: TransactionScanResponse['simulation'],
): TransactionSimulationError | null => {
    if (simulation?.status !== 'Error') {
        return null;
    }

    return simulation;
};

export type TxSimulationRiskSummary = {
    validationRisk: TxSimulationValidationSummary | null;
    simulationFailure: TransactionSimulationError | null;
};

/**
 * Extract validation risk and simulation failure from a Blockaid transaction scan response.
 */
export const getTxSimulationRiskSummary = (
    scanResponse: Pick<TransactionScanResponse, 'validation' | 'simulation'> | undefined,
): TxSimulationRiskSummary => ({
    validationRisk: getValidationRiskSummary(scanResponse?.validation),
    simulationFailure: getSimulationFailureSummary(scanResponse?.simulation),
});
