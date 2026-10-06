import type {
    EvmAssetDiff,
    SolanaAssetDiff,
    SolanaMessageScanResponse,
    SolanaSimulation,
    StellarAssetDiff,
    StellarSimulation,
    StellarTxScanResponse,
    TransactionScanResponse,
    TransactionSimulation,
} from '../types';
import {
    getEvmSimulationSummary,
    getSolanaAssetDiffs,
    getStellarAssetDiffs,
} from './getSimulationAssetDiffs';

const createEvmResponse = (simulation: TransactionScanResponse['simulation']) =>
    ({ simulation }) as TransactionScanResponse;

const createEvmSimulation = (accountSummary: unknown): TransactionScanResponse['simulation'] =>
    ({ status: 'Success', account_summary: accountSummary }) as TransactionSimulation;

const createSolanaResponse = (
    simulation: SolanaSimulation | null,
    hasResult = true,
): SolanaMessageScanResponse => ({
    encoding: 'base64',
    request_id: null,
    status: 'SUCCESS',
    result: hasResult ? { gas_estimation: null, simulation, validation: null } : null,
});

const createStellarResponse = (simulation: StellarTxScanResponse['simulation']) => ({
    simulation,
});

// Only the fields the readers touch matter; the SDK shapes carry far more.
const solanaDiff = (out: boolean, symbol: string) =>
    ({ asset: { symbol }, ...(out ? { out: {} } : { in: {} }) }) as SolanaAssetDiff;

const evmDiff = (out: string[], incoming: string[]) =>
    ({
        out: out.map(usd_price => ({ usd_price })),
        in: incoming.map(usd_price => ({ usd_price })),
    }) as EvmAssetDiff;

describe('getEvmSimulationSummary', () => {
    it('returns null when the scan carries no simulation', () => {
        expect(getEvmSimulationSummary(createEvmResponse(undefined))).toBeNull();
    });

    it('returns null when the simulation failed', () => {
        const simulation = {
            status: 'Error',
            error: 'reverted',
            description: '',
        } as TransactionScanResponse['simulation'];

        expect(getEvmSimulationSummary(createEvmResponse(simulation))).toBeNull();
    });

    it('returns null when a successful simulation has no account summary', () => {
        const simulation = { status: 'Success' } as TransactionSimulation;

        expect(getEvmSimulationSummary(createEvmResponse(simulation))).toBeNull();
    });

    it('returns empty collections when the simulation found no changes', () => {
        const summary = getEvmSimulationSummary(
            createEvmResponse(createEvmSimulation({ assets_diffs: [], exposures: [] })),
        );

        expect(summary).toMatchObject({ assetsDiffs: [], exposures: [] });
    });

    it('orders outgoing diffs first, then each group by USD value descending', () => {
        const cheapOut = evmDiff(['1'], []);
        const richOut = evmDiff(['50'], []);
        const cheapIn = evmDiff([], ['2']);
        const richIn = evmDiff([], ['70']);

        const summary = getEvmSimulationSummary(
            createEvmResponse(
                createEvmSimulation({
                    assets_diffs: [cheapIn, cheapOut, richIn, richOut],
                    exposures: [],
                }),
            ),
        );

        expect(summary?.assetsDiffs).toEqual([richOut, cheapOut, richIn, cheapIn]);
    });

    it('does not reorder the response it was handed', () => {
        const incoming = evmDiff([], ['2']);
        const assetsDiffs = [incoming, evmDiff(['50'], [])];

        getEvmSimulationSummary(
            createEvmResponse(createEvmSimulation({ assets_diffs: assetsDiffs, exposures: [] })),
        );

        expect(assetsDiffs[0]).toBe(incoming);
    });
});

describe('getSolanaAssetDiffs', () => {
    it('returns null when the scan carries no result', () => {
        expect(getSolanaAssetDiffs(createSolanaResponse(null, false))).toBeNull();
    });

    it('returns null when the result carries no simulation', () => {
        expect(getSolanaAssetDiffs(createSolanaResponse(null))).toBeNull();
    });

    // The regression this whole module exists for: Blockaid answers SUCCESS with a simulation that
    // has no account summary once the scanned transaction has gone stale.
    it('returns null when the simulation has no account summary', () => {
        expect(getSolanaAssetDiffs(createSolanaResponse({} as SolanaSimulation))).toBeNull();
    });

    it('returns an empty list when the summary holds no asset diffs', () => {
        const simulation = { account_summary: {} } as SolanaSimulation;

        expect(getSolanaAssetDiffs(createSolanaResponse(simulation))).toEqual([]);
    });

    it('orders outgoing diffs before incoming ones', () => {
        const incoming = solanaDiff(false, 'USDC');
        const outgoing = solanaDiff(true, 'SOL');
        const simulation = {
            account_summary: { account_assets_diff: [incoming, outgoing] },
        } as SolanaSimulation;

        expect(getSolanaAssetDiffs(createSolanaResponse(simulation))).toEqual([outgoing, incoming]);
    });

    it('does not reorder the response it was handed', () => {
        const incoming = solanaDiff(false, 'USDC');
        const accountAssetsDiff = [incoming, solanaDiff(true, 'SOL')];
        const simulation = {
            account_summary: { account_assets_diff: accountAssetsDiff },
        } as SolanaSimulation;

        getSolanaAssetDiffs(createSolanaResponse(simulation));

        expect(accountAssetsDiff[0]).toBe(incoming);
    });
});

describe('getStellarAssetDiffs', () => {
    it('returns null when the scan carries no simulation', () => {
        expect(getStellarAssetDiffs(createStellarResponse(undefined))).toBeNull();
    });

    it('returns null when the simulation failed', () => {
        expect(
            getStellarAssetDiffs(createStellarResponse({ status: 'Error', error: 'bad envelope' })),
        ).toBeNull();
    });

    it('returns null when a successful simulation has no account summary', () => {
        const simulation = { status: 'Success' } as StellarSimulation;

        expect(getStellarAssetDiffs(createStellarResponse(simulation))).toBeNull();
    });

    it('returns an empty list when the summary holds no asset diffs', () => {
        const simulation = { status: 'Success', account_summary: {} } as StellarSimulation;

        expect(getStellarAssetDiffs(createStellarResponse(simulation))).toEqual([]);
    });

    it('returns the asset diffs the summary carries', () => {
        const assetDiff = { asset: { code: 'XLM' } } as StellarAssetDiff;
        const simulation = {
            status: 'Success',
            account_summary: { account_assets_diffs: [assetDiff] },
        } as StellarSimulation;

        expect(getStellarAssetDiffs(createStellarResponse(simulation))).toEqual([assetDiff]);
    });
});
