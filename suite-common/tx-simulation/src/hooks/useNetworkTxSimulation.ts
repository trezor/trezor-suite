import type { TransactionScanResponse } from '@blockaid/client/resources/evm';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { client } from '../client';
import { type UseTxSimulationParams } from './useTxSimulationParams';

type TxSimulationCommonResult = { needsDisclaimer: boolean };
export type TxSimulationEVMResult = TransactionScanResponse & TxSimulationCommonResult;

export type NetworkTxSimulationResult = {
    method: 'ethereumSignTransaction' | 'ethereumSignTypedData';
    payload: TxSimulationEVMResult;
};

const getEVMNeedsDisclaimer = ({ validation, simulation }: TransactionScanResponse): boolean =>
    validation?.result_type === 'Malicious' ||
    validation?.result_type === 'Warning' ||
    simulation?.status === 'Error';

async function handleTxScan(input: UseTxSimulationParams): Promise<NetworkTxSimulationResult> {
    switch (input?.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const scanResult = await client.evm.jsonRpc.scan(input.params);

            if (scanResult.simulation?.status === 'Success') {
                // Stable order across refetches: outgoing assets first, then incoming, each by USD value desc.
                const sumUsd = (diffs: ReadonlyArray<{ usd_price?: string }>) =>
                    diffs.reduce((acc, d) => acc + Number(d.usd_price ?? 0), 0);

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

        default:
            // @ts-expect-error
            throw new Error(`TX Simulation isn't supported for: ${params?.kind}.`);
    }
}

export function isTxSimulationResultWithMethods<Result extends NetworkTxSimulationResult>(
    methods: ReadonlyArray<Result['method']>,
    result?: Result | null,
): result is Result {
    return result ? methods.includes(result.method) : false;
}

export interface UseTxSimulationProps {
    onSuccess?: (result: NetworkTxSimulationResult) => void;
}

export function useNetworkTxSimulation(
    input: UseTxSimulationParams,
    { onSuccess }: UseTxSimulationProps = {},
) {
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
