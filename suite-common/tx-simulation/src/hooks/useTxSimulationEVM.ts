import type { JsonRpcScanParams } from '@blockaid/client/resources/evm';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { client } from '../client';

export function useTxSimulationEVM(
    input: JsonRpcScanParams | null,
    onSuccess?: (result: TxSimulationEVMResult) => void,
) {
    return useQuery({
        enabled: Boolean(input),
        queryKey: commonQueryKeys.txSimulationEVM(input),
        queryFn: async () => {
            const simulationResult = await client.evm.jsonRpc.scan(input!);
            const needsDisclaimer =
                simulationResult.validation?.result_type === 'Malicious' ||
                simulationResult.validation?.result_type === 'Warning' ||
                simulationResult.simulation?.status === 'Error';

            const result = {
                ...simulationResult,
                needsDisclaimer,
            };

            onSuccess?.(result);

            return result;
        },
    });
}

export type TxSimulationEVMResult = NonNullable<ReturnType<typeof useTxSimulationEVM>['data']>;
