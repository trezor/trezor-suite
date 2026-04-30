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
                // Prevent flickering of asset diffs as the data are being refetched and ordered each diffently.
                scanResult.simulation.account_summary.assets_diffs =
                    scanResult.simulation.account_summary.assets_diffs.toSorted(
                        (a, b) => a.out.length - b.in.length,
                    );
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
