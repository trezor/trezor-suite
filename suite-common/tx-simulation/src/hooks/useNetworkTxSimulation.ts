import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { exhaustive } from '@trezor/type-utils';

import { client } from '../client';
import {
    type NetworkTxSimulationResult,
    type SolanaMessageScanResponse,
    type StellarTxScanResponse,
    type TransactionScanResponse,
    type TxSimulationEVMResult,
    type TxSimulationSolanaResult,
    type TxSimulationStellarResult,
} from '../types';
import { type GetTxSimulationParams } from '../utils';

const getEVMNeedsDisclaimer = ({ validation, simulation }: TransactionScanResponse): boolean =>
    validation?.result_type === 'Malicious' ||
    validation?.result_type === 'Warning' ||
    simulation?.status === 'Error';

// Solana reports transport-level failures on the top-level `status`; its simulation has no `status`.
const getSolanaNeedsDisclaimer = ({ status, result }: SolanaMessageScanResponse): boolean =>
    status === 'ERROR' ||
    result?.validation?.result_type === 'Malicious' ||
    result?.validation?.result_type === 'Warning' ||
    result?.validation?.result_type === 'Error';

// Stellar has no envelope status; each half of the response reports its own.
const getStellarNeedsDisclaimer = ({ validation, simulation }: StellarTxScanResponse): boolean => {
    const resultType = validation && 'result_type' in validation ? validation.result_type : null;

    return (
        resultType === 'Malicious' ||
        resultType === 'Warning' ||
        validation?.status === 'Error' ||
        simulation?.status === 'Error'
    );
};

// Stable order across refetches: outgoing assets first, then incoming, each by USD value desc.
const sumUsd = (diffs: ReadonlyArray<{ usd_price?: string }>) =>
    diffs.reduce((acc, d) => acc + Number(d.usd_price ?? 0), 0);

async function handleTxScan(input: GetTxSimulationParams): Promise<NetworkTxSimulationResult> {
    if (!input) {
        throw new Error('TX Simulation params are missing.');
    }

    switch (input.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const scanResult = await client.evm.jsonRpc.scan(input.params);

            if (scanResult.simulation?.status === 'Success') {
                scanResult.simulation.account_summary.assets_diffs =
                    scanResult.simulation.account_summary.assets_diffs.toSorted((a, b) => {
                        const aIsOut = a.out.length > 0;
                        const bIsOut = b.out.length > 0;
                        if (aIsOut !== bIsOut) return aIsOut ? -1 : 1;

                        return aIsOut ? sumUsd(b.out) - sumUsd(a.out) : sumUsd(b.in) - sumUsd(a.in);
                    });
            }

            const result: TxSimulationEVMResult = {
                ...scanResult,
                needsDisclaimer: getEVMNeedsDisclaimer(scanResult),
            };

            return { method: input.method, payload: result } as const;
        }

        case 'solanaSignTransaction': {
            const scanResult = await client.solana.message.scan(input.params);
            const accountSummary = scanResult.result?.simulation?.account_summary;

            if (accountSummary?.account_assets_diff) {
                // Solana diffs hold a single in/out each, so outgoing-first is the whole ordering.
                accountSummary.account_assets_diff = accountSummary.account_assets_diff.toSorted(
                    (a, b) => Number(Boolean(b.out)) - Number(Boolean(a.out)),
                );
            }

            const result: TxSimulationSolanaResult = {
                ...scanResult,
                needsDisclaimer: getSolanaNeedsDisclaimer(scanResult),
            };

            return { method: input.method, payload: result } as const;
        }

        case 'stellarSignTransaction': {
            const scanResult = await client.stellar.transaction.scan(input.params);

            const result: TxSimulationStellarResult = {
                ...scanResult,
                needsDisclaimer: getStellarNeedsDisclaimer(scanResult),
            };

            return { method: input.method, payload: result } as const;
        }

        default:
            return exhaustive(input);
    }
}

export function isTxSimulationResultWithMethods<
    const Methods extends ReadonlyArray<NetworkTxSimulationResult['method']>,
>(
    methods: Methods,
    result?: NetworkTxSimulationResult | null,
): result is Extract<NetworkTxSimulationResult, { method: Methods[number] }> {
    return result ? methods.includes(result.method) : false;
}

export interface UseTxSimulationProps {
    onSuccess?: (result: NetworkTxSimulationResult) => void;
}

export function useNetworkTxSimulation(
    input: GetTxSimulationParams,
    { onSuccess }: UseTxSimulationProps = {},
) {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is input.params; onSuccess is a side-effect callback and input.method is derived from the same params — neither belongs in the key
    return useQuery({
        enabled: Boolean(input),
        queryKey: commonQueryKeys.networkTxSimulation(input?.params),
        queryFn: async () => {
            const result = await handleTxScan(input);

            onSuccess?.(result);

            return result;
        },
    });
}
