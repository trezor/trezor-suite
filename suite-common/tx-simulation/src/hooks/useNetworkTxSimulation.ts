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
import {
    type GetTxSimulationParams,
    getEvmSimulationFailure,
    getSolanaSimulationFailure,
    getStellarSimulationFailure,
} from '../utils';

const getEVMNeedsDisclaimer = (response: TransactionScanResponse): boolean =>
    response.validation?.result_type === 'Malicious' ||
    response.validation?.result_type === 'Warning' ||
    getEvmSimulationFailure(response) !== null;

const getSolanaNeedsDisclaimer = (response: SolanaMessageScanResponse): boolean =>
    response.result?.validation?.result_type === 'Malicious' ||
    response.result?.validation?.result_type === 'Warning' ||
    getSolanaSimulationFailure(response) !== null;

// Stellar has no envelope status; each half of the response reports its own.
const getStellarNeedsDisclaimer = (response: StellarTxScanResponse): boolean => {
    const { validation } = response;
    const resultType = validation && 'result_type' in validation ? validation.result_type : null;

    return (
        resultType === 'Malicious' ||
        resultType === 'Warning' ||
        validation?.status === 'Error' ||
        getStellarSimulationFailure(response) !== null
    );
};

async function handleTxScan(input: GetTxSimulationParams): Promise<NetworkTxSimulationResult> {
    if (!input) {
        throw new Error('TX Simulation params are missing.');
    }

    switch (input.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const scanResult = await client.evm.jsonRpc.scan(input.params);

            const result: TxSimulationEVMResult = {
                ...scanResult,
                needsDisclaimer: getEVMNeedsDisclaimer(scanResult),
            };

            return { method: input.method, payload: result } as const;
        }

        case 'solanaSignTransaction': {
            const scanResult = await client.solana.message.scan(input.params);

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
