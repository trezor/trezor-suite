import type {
    TransactionSimulation,
    TransactionSimulationError,
    TransactionValidation,
    TransactionValidationError,
} from '@blockaid/client/resources/evm';

import { getTxSimulationRiskSummary } from '../getTxSimulationRiskSummary';

const createValidation = (
    overrides: Partial<TransactionValidation> = {},
): TransactionValidation => ({
    status: 'Success',
    result_type: 'Benign',
    features: [],
    ...overrides,
});

const createSimulationError = (
    overrides: Partial<TransactionSimulationError> = {},
): TransactionSimulationError => ({
    status: 'Error',
    error: 'Simulation failed',
    description: 'The transaction is likely to fail',
    ...overrides,
});

// Only `status` is read when checking for a simulation failure.
const successSimulation = { status: 'Success' } as TransactionSimulation;

describe('getTxSimulationRiskSummary', () => {
    it('returns no risks without a scan response', () => {
        expect(getTxSimulationRiskSummary(undefined)).toEqual({
            validationRisk: null,
            simulationFailure: null,
        });
    });

    it('returns no risks for a benign validation with a successful simulation', () => {
        const summary = getTxSimulationRiskSummary({
            validation: createValidation(),
            simulation: successSimulation,
        });

        expect(summary).toEqual({ validationRisk: null, simulationFailure: null });
    });

    it('extracts the full validation summary for a malicious verdict', () => {
        const feature = {
            feature_id: 'KNOWN_MALICIOUS_ADDRESS',
            type: 'Malicious',
            description: 'Interaction with a known malicious address',
            address: '0x0000000000000000000000000000000000001234',
        } as const;

        const summary = getTxSimulationRiskSummary({
            validation: createValidation({
                result_type: 'Malicious',
                classification: 'known_attacker',
                reason: 'transfer_farming',
                description: 'A known malicious address is involved',
                features: [feature],
            }),
        });

        expect(summary.validationRisk).toEqual({
            riskLevel: 'malicious',
            classification: 'known_attacker',
            reason: 'transfer_farming',
            description: 'A known malicious address is involved',
            features: [feature],
        });
        expect(summary.simulationFailure).toBeNull();
    });

    it('marks a warning verdict with the warning risk level', () => {
        const summary = getTxSimulationRiskSummary({
            validation: createValidation({ result_type: 'Warning' }),
        });

        expect(summary.validationRisk).toMatchObject({ riskLevel: 'warning' });
    });

    it('normalizes empty validation strings to null', () => {
        const summary = getTxSimulationRiskSummary({
            validation: createValidation({
                result_type: 'Warning',
                classification: '',
                reason: '',
                description: '',
            }),
        });

        expect(summary.validationRisk).toEqual({
            riskLevel: 'warning',
            classification: null,
            reason: null,
            description: null,
            features: [],
        });
    });

    it('ignores the validation error variant', () => {
        const validationError: TransactionValidationError = {
            status: 'Success',
            result_type: 'Error',
            classification: '',
            description: '',
            reason: '',
            error: 'validation failed',
            features: [],
        };

        expect(
            getTxSimulationRiskSummary({ validation: validationError }).validationRisk,
        ).toBeNull();
    });

    it('extracts the failure summary including the error detail code', () => {
        const summary = getTxSimulationRiskSummary({
            simulation: createSimulationError({
                error_details: {
                    code: 'UNSUPPORTED_EIP712_MESSAGE',
                    domain_name: 'Permit2',
                    message_type: 'PermitSingle',
                },
            }),
        });

        expect(summary.simulationFailure).toEqual({
            error: 'Simulation failed',
            description: 'The transaction is likely to fail',
            code: 'UNSUPPORTED_EIP712_MESSAGE',
        });
        expect(summary.validationRisk).toBeNull();
    });

    it('returns a null code when the failure has no error details', () => {
        const summary = getTxSimulationRiskSummary({ simulation: createSimulationError() });

        expect(summary.simulationFailure).toMatchObject({ code: null });
    });

    it('normalizes empty failure strings to null', () => {
        const summary = getTxSimulationRiskSummary({
            simulation: createSimulationError({ error: '', description: '' }),
        });

        expect(summary.simulationFailure).toEqual({ error: null, description: null, code: null });
    });

    it('reports both risks when the tx is flagged and would also fail', () => {
        const summary = getTxSimulationRiskSummary({
            validation: createValidation({ result_type: 'Malicious' }),
            simulation: createSimulationError(),
        });

        expect(summary.validationRisk).not.toBeNull();
        expect(summary.simulationFailure).not.toBeNull();
    });
});
