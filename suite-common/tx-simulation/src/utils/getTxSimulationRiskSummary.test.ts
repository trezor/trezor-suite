import type {
    NetworkTxSimulationResult,
    SolanaMessageScanResponse,
    SolanaSimulation,
    SolanaValidation,
    StellarSimulation,
    StellarTxScanResponse,
    TransactionScanResponse,
    TransactionSimulation,
    TransactionSimulationError,
    TransactionValidation,
} from '../types';
import { getTxSimulationRiskSummary } from './getTxSimulationRiskSummary';

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

// A failure check reads the status and whether an account summary came back at all; the summary's
// own contents are irrelevant here, so it stays untyped rather than spelling out the SDK shape.
const emptyAccountSummary: unknown = { assets_diffs: [], exposures: [] };

const successSimulation = {
    status: 'Success',
    account_summary: emptyAccountSummary,
} as TransactionSimulation;

const createEvmResult = (
    payload: Pick<TransactionScanResponse, 'validation' | 'simulation'>,
): NetworkTxSimulationResult => ({
    method: 'ethereumSignTransaction',
    payload: { ...payload, needsDisclaimer: false } as NetworkTxSimulationResult['payload'] &
        TransactionScanResponse,
});

const createSolanaResult = (
    payload: Pick<SolanaMessageScanResponse, 'status' | 'error' | 'result'>,
): NetworkTxSimulationResult => ({
    method: 'solanaSignTransaction',
    payload: {
        encoding: 'base64',
        request_id: null,
        needsDisclaimer: false,
        ...payload,
    },
});

const createSolanaValidation = (overrides: Partial<SolanaValidation> = {}): SolanaValidation =>
    ({
        result_type: 'Benign',
        classification: '',
        description: '',
        reason: '',
        features: [],
        extended_features: [],
        ...overrides,
    }) as SolanaValidation;

const createStellarResult = (
    payload: Pick<StellarTxScanResponse, 'simulation' | 'validation'>,
): NetworkTxSimulationResult => ({
    method: 'stellarSignTransaction',
    payload: { ...payload, needsDisclaimer: false },
});

describe('getTxSimulationRiskSummary', () => {
    it('returns no risks without a scan response', () => {
        expect(getTxSimulationRiskSummary(undefined)).toEqual({
            validationRisk: null,
            simulationFailure: null,
        });
    });

    it('returns no risks for a benign validation with a successful simulation', () => {
        const summary = getTxSimulationRiskSummary(
            createEvmResult({
                validation: createValidation(),
                simulation: successSimulation,
            }),
        );

        expect(summary).toEqual({ validationRisk: null, simulationFailure: null });
    });

    it('extracts the full validation summary for a malicious verdict', () => {
        const feature = {
            feature_id: 'KNOWN_MALICIOUS_ADDRESS',
            type: 'Malicious',
            description: 'Interaction with a known malicious address',
            address: '0x0000000000000000000000000000000000001234',
        } as const;

        const summary = getTxSimulationRiskSummary(
            createEvmResult({
                validation: createValidation({
                    result_type: 'Malicious',
                    classification: 'known_attacker',
                    reason: 'transfer_farming',
                    description: 'A known malicious address is involved',
                    features: [feature],
                }),
            }),
        );

        expect(summary.validationRisk).toEqual({
            riskLevel: 'Malicious',
            classification: 'known_attacker',
            reason: 'transfer_farming',
            description: 'A known malicious address is involved',
            features: [feature],
        });
        expect(summary.simulationFailure).toBeNull();
    });

    it('marks a warning verdict with the warning risk level', () => {
        const summary = getTxSimulationRiskSummary(
            createEvmResult({ validation: createValidation({ result_type: 'Warning' }) }),
        );

        expect(summary.validationRisk).toMatchObject({ riskLevel: 'Warning' });
    });

    it('reports both risks when the tx is flagged and would also fail', () => {
        const summary = getTxSimulationRiskSummary(
            createEvmResult({
                validation: createValidation({ result_type: 'Malicious' }),
                simulation: createSimulationError(),
            }),
        );

        expect(summary.validationRisk).not.toBeNull();
        expect(summary.simulationFailure).not.toBeNull();
    });

    it('reads the Solana verdict from the nested result and its extended features', () => {
        const extendedFeature = {
            feature_id: 'DRAINER',
            type: 'Malicious',
            description: 'Known drainer program',
            address: 'So11111111111111111111111111111111111111112',
        } as const;

        const summary = getTxSimulationRiskSummary(
            createSolanaResult({
                status: 'SUCCESS',
                result: {
                    gas_estimation: null,
                    simulation: null,
                    validation: createSolanaValidation({
                        result_type: 'Malicious',
                        classification: 'known_attacker',
                        // `features` is a plain string list on Solana and must not be surfaced.
                        features: ['DRAINER'],
                        extended_features: [extendedFeature],
                    }),
                },
            }),
        );

        expect(summary.validationRisk).toMatchObject({
            riskLevel: 'Malicious',
            classification: 'known_attacker',
            features: [extendedFeature],
        });
        expect(summary.simulationFailure).toBeNull();
    });

    it('treats a Solana envelope error as a simulation failure', () => {
        const summary = getTxSimulationRiskSummary(
            createSolanaResult({ status: 'ERROR', error: 'Invalid transaction' }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Invalid transaction' });
        expect(summary.validationRisk).toBeNull();
    });

    it('reads a malicious Stellar verdict with its features', () => {
        const feature = {
            feature_id: 'KNOWN_MALICIOUS_ADDRESS',
            type: 'Malicious',
            description: 'Known malicious account',
            address: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
        } as const;

        const summary = getTxSimulationRiskSummary(
            createStellarResult({
                validation: {
                    status: 'Success',
                    result_type: 'Malicious',
                    classification: 'known_attacker',
                    description: 'Known malicious account',
                    reason: 'transfer_farming',
                    features: [feature],
                },
            }),
        );

        expect(summary.validationRisk).toMatchObject({
            riskLevel: 'Malicious',
            features: [feature],
        });
        expect(summary.simulationFailure).toBeNull();
    });

    it('treats a failed Stellar simulation as a simulation failure', () => {
        const summary = getTxSimulationRiskSummary(
            createStellarResult({ simulation: { status: 'Error', error: 'Bad envelope' } }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Bad envelope' });
        expect(summary.validationRisk).toBeNull();
    });

    it('treats an EVM simulation without an account summary as a simulation failure', () => {
        const summary = getTxSimulationRiskSummary(
            createEvmResult({
                validation: createValidation(),
                simulation: { status: 'Success' } as TransactionSimulation,
            }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Simulation failed' });
        expect(summary.validationRisk).toBeNull();
    });

    it('treats a Solana simulation without an account summary as a simulation failure', () => {
        const summary = getTxSimulationRiskSummary(
            createSolanaResult({
                status: 'SUCCESS',
                result: {
                    gas_estimation: null,
                    simulation: {} as SolanaSimulation,
                    validation: createSolanaValidation(),
                },
            }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Simulation failed' });
        expect(summary.validationRisk).toBeNull();
    });

    it('treats a failed Solana validation as a simulation failure so it can be acknowledged', () => {
        const summary = getTxSimulationRiskSummary(
            createSolanaResult({
                status: 'SUCCESS',
                result: {
                    gas_estimation: null,
                    simulation: null,
                    validation: createSolanaValidation({ result_type: 'Error' }),
                },
            }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Simulation failed' });
        expect(summary.validationRisk).toBeNull();
    });

    it('treats a Stellar simulation without an account summary as a simulation failure', () => {
        const summary = getTxSimulationRiskSummary(
            createStellarResult({ simulation: { status: 'Success' } as StellarSimulation }),
        );

        expect(summary.simulationFailure).toEqual({ error: 'Simulation failed' });
        expect(summary.validationRisk).toBeNull();
    });
});
