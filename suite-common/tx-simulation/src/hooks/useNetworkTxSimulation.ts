import { commonQueryKeys, useQuery, useQueryClient } from '@suite-common/react-query';
import { exhaustive } from '@trezor/type-utils';

import { isHexBlockaidChain, markBlockaidChainUnsupported } from '../chains';
import { getBlockaidClient } from '../client';
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

/** Blockaid does not cover the chain of a user-added network; the transaction can go on unscanned. */
export class TxSimulationChainUnsupportedError extends Error {
    constructor() {
        super('Transaction simulation is not available on this network.');
        this.name = 'TxSimulationChainUnsupportedError';
    }
}

// A 4xx answer rejects the request itself, so asking again would get the same answer.
const isRejectedRequest = (error: unknown) => {
    const status = (error as { status?: unknown } | null)?.status;

    return typeof status === 'number' && status >= 400 && status < 500 && status !== 429;
};

/** A user-added chain Blockaid rejects is remembered, so its next transactions skip the scan. */
export const toEvmScanError = (chain: string | undefined, error: unknown) => {
    if (chain && isHexBlockaidChain(chain) && isRejectedRequest(error)) {
        markBlockaidChainUnsupported(chain);

        return new TxSimulationChainUnsupportedError();
    }

    return error;
};

async function handleTxScan(input: GetTxSimulationParams): Promise<NetworkTxSimulationResult> {
    if (!input) {
        throw new Error('TX Simulation params are missing.');
    }

    const client = await getBlockaidClient();

    switch (input.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const { chain } = input.params;
            const isChainSupported = Boolean(chain);
            const scanResult = await client.evm.jsonRpc.scan(input.params).catch(error => {
                throw toEvmScanError(chain, error);
            });

            const result: TxSimulationEVMResult = {
                ...scanResult,
                needsDisclaimer: getEVMNeedsDisclaimer(scanResult),
                isChainSupported,
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
    const defaultRetry = useQueryClient().getDefaultOptions().queries?.retry;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is input.params; onSuccess is a side-effect callback and input.method is derived from the same params — neither belongs in the key
    return useQuery({
        enabled: Boolean(input),
        queryKey: commonQueryKeys.networkTxSimulation(input?.params),
        retry: (failureCount, error) => {
            if (error instanceof TxSimulationChainUnsupportedError) return false;
            if (typeof defaultRetry === 'function') return defaultRetry(failureCount, error);
            if (typeof defaultRetry === 'number') return failureCount < defaultRetry;

            return defaultRetry ?? true;
        },
        queryFn: async () => {
            const result = await handleTxScan(input);

            onSuccess?.(result);

            return result;
        },
    });
}
