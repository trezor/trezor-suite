import {
    type NetworkTxSimulationResult,
    type TxSimulationValidationSummary,
    getTxSimulationRiskSummary,
} from '@suite-common/tx-simulation';

import { type FiatDeviationResult } from '../../hooks/useExchangeFiatDeviation';

export type ExchangeIssueSeverity = 'warning' | 'critical';

export type ExchangeIssue =
    | {
          type: 'slippage-too-low';
          severity: ExchangeIssueSeverity;
      }
    | {
          type: 'high-risk';
          severity: ExchangeIssueSeverity;
          validation: TxSimulationValidationSummary;
      }
    | { type: 'price-impact'; severity: ExchangeIssueSeverity; deviation: number }
    | {
          type: 'high-risk-with-price-impact';
          severity: ExchangeIssueSeverity;
          validation: TxSimulationValidationSummary;
          deviation: number;
      };

type GetExchangeIssueParams = {
    simulationResult: NetworkTxSimulationResult | undefined;
    fiatDeviation: FiatDeviationResult | null;
};

/**
 * Get the issues related to exchange, based on the transaction simulation result and fiat deviation.
 * Returns an object describing the issue, or null if there are no issues.
 */
export const getExchangeIssue = ({
    simulationResult,
    fiatDeviation,
}: GetExchangeIssueParams): ExchangeIssue | null => {
    const { validationRisk, simulationFailure } = getTxSimulationRiskSummary(simulationResult);

    if (simulationFailure) {
        return {
            type: 'slippage-too-low',
            severity: 'warning',
        };
    }

    if (validationRisk && fiatDeviation?.exceedsThreshold) {
        return {
            type: 'high-risk-with-price-impact',
            severity: 'critical',
            validation: validationRisk,
            deviation: fiatDeviation.deviation,
        };
    }

    if (validationRisk) {
        return {
            type: 'high-risk',
            severity: 'critical',
            validation: validationRisk,
        };
    }

    if (fiatDeviation?.exceedsThreshold) {
        return {
            type: 'price-impact',
            severity: fiatDeviation.exceedsHighThreshold ? 'critical' : 'warning',
            deviation: fiatDeviation.deviation,
        };
    }

    return null;
};
