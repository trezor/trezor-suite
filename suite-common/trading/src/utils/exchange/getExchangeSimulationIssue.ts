import {
    type NetworkTxSimulationResult,
    type TxSimulationValidationSummary,
    getTxSimulationRiskSummary,
} from '@suite-common/tx-simulation';

import { type FiatDeviationResult } from '../../hooks/useExchangeFiatDeviation';

export type ExchangeSimulationIssueSeverity = 'warning' | 'critical';

export type ExchangeSimulationIssue =
    | {
          type: 'high-risk';
          severity: ExchangeSimulationIssueSeverity;
          validation: TxSimulationValidationSummary;
      }
    | { type: 'price-impact'; severity: ExchangeSimulationIssueSeverity; deviation: number }
    | {
          type: 'high-risk-with-price-impact';
          severity: ExchangeSimulationIssueSeverity;
          validation: TxSimulationValidationSummary;
          deviation: number;
      };

type GetExchangeSimulationIssueParams = {
    simulationResult: NetworkTxSimulationResult | undefined;
    fiatDeviation: FiatDeviationResult | null;
};

/**
 * Get the issues related to a swap on an exchange, based on the transaction simulation result and fiat deviation.
 * Returns an object describing the issue, or null if there are no issues.
 */
export const getExchangeSimulationIssue = ({
    simulationResult,
    fiatDeviation,
}: GetExchangeSimulationIssueParams): ExchangeSimulationIssue | null => {
    const { validationRisk } = getTxSimulationRiskSummary(simulationResult?.payload);

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
