import {
    type NetworkTxSimulationResult,
    type TransactionScanResponse,
    type TxSimulationEVMResult,
} from '@suite-common/tx-simulation';

import { getExchangeIssue } from './getExchangeIssue';
import { type FiatDeviationResult } from '../../hooks/useExchangeFiatDeviation';

const createSimulationResult = (
    scan: Pick<TxSimulationEVMResult, 'validation' | 'simulation'>,
): NetworkTxSimulationResult => ({
    method: 'ethereumSignTransaction',
    payload: { block: '123', chain: 'ethereum', needsDisclaimer: false, ...scan },
});

const createValidation = (
    resultType: 'Benign' | 'Warning' | 'Malicious',
): TransactionScanResponse['validation'] => ({
    status: 'Success',
    result_type: resultType,
    description: 'Validation verdict description',
    features: [],
});

const simulationError: TransactionScanResponse['simulation'] = {
    status: 'Error',
    error: 'execution reverted',
    description: 'The transaction is likely to fail',
};

const createFiatDeviation = (deviation: number): FiatDeviationResult => ({
    deviation,
    exceedsThreshold: deviation >= 0.1,
    exceedsHighThreshold: deviation >= 0.2,
});

describe('getExchangeIssue', () => {
    it('returns no issue without simulation data and fiat deviation', () => {
        expect(getExchangeIssue({ simulationResult: undefined, fiatDeviation: null })).toBeNull();
    });

    it('returns no issue for a benign verdict with an acceptable deviation', () => {
        const issue = getExchangeIssue({
            simulationResult: createSimulationResult({ validation: createValidation('Benign') }),
            fiatDeviation: createFiatDeviation(0.05),
        });

        expect(issue).toBeNull();
    });

    it('reports a warning price impact above the threshold', () => {
        const issue = getExchangeIssue({
            simulationResult: undefined,
            fiatDeviation: createFiatDeviation(0.15),
        });

        expect(issue).toEqual({ type: 'price-impact', severity: 'warning', deviation: 0.15 });
    });

    it('reports a critical price impact above the high threshold', () => {
        const issue = getExchangeIssue({
            simulationResult: undefined,
            fiatDeviation: createFiatDeviation(0.25),
        });

        expect(issue).toEqual({ type: 'price-impact', severity: 'critical', deviation: 0.25 });
    });

    it('reports a critical high risk for a malicious verdict', () => {
        const issue = getExchangeIssue({
            simulationResult: createSimulationResult({ validation: createValidation('Malicious') }),
            fiatDeviation: null,
        });

        expect(issue).toEqual({
            type: 'high-risk',
            severity: 'critical',
            validation: {
                riskLevel: 'Malicious',
                description: 'Validation verdict description',
                features: [],
            },
        });
    });

    it('reports a critical high risk for a warning verdict', () => {
        const issue = getExchangeIssue({
            simulationResult: createSimulationResult({ validation: createValidation('Warning') }),
            fiatDeviation: null,
        });

        expect(issue).toMatchObject({
            type: 'high-risk',
            severity: 'critical',
            validation: { riskLevel: 'Warning' },
        });
    });

    it('returns no issue for a simulation failure without a risky verdict', () => {
        const issue = getExchangeIssue({
            simulationResult: createSimulationResult({ simulation: simulationError }),
            fiatDeviation: null,
        });

        expect(issue).toEqual({
            type: 'slippage-too-low',
            severity: 'warning',
        });
    });

    it('combines a risky verdict with a price impact into a single critical issue', () => {
        const issue = getExchangeIssue({
            simulationResult: createSimulationResult({ validation: createValidation('Malicious') }),
            fiatDeviation: createFiatDeviation(0.15),
        });

        expect(issue).toMatchObject({
            type: 'high-risk-with-price-impact',
            severity: 'critical',
            deviation: 0.15,
            validation: { riskLevel: 'Malicious' },
        });
    });
});
