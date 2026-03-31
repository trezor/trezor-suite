import { type ClusterUrl, type RpcTransportFromClusterUrl } from '@solana/kit';
import { parseJsonWithBigInts, stringifyJsonWithBigints } from '@solana/rpc-spec-types';

type JsonRpcPayload = Readonly<{
    id?: number;
    jsonrpc: '2.0';
    method: string;
    params: unknown;
}>;

type JsonRpcResponse = {
    id: bigint | number;
    jsonrpc: '2.0';
} & ({ result: unknown } | { error: { code: number; data?: unknown; message: string } });

type PendingCall<TResponse = unknown> = {
    payload: JsonRpcPayload;
    reject: (reason?: unknown) => void;
    resolve: (value: TResponse) => void;
    signal?: AbortSignal;
};

export type BatchingTransportOptions = {
    /** Maximum number of calls to batch into a single HTTP request. Default: 20. */
    maxBatchSize?: number;
};

const DEFAULT_MAX_BATCH_SIZE = 20;

/**
 * Batching RPC transport for Solana.
 *
 * Collects individual JSON-RPC calls within a microtask and sends them as a
 * single batch request (JSON-RPC 2.0 array). Responses are demultiplexed back
 * to the individual callers.
 *
 * Falls back to a single (non-batched) call when only one request is queued.
 */
export const getBatchingTransport = <TClusterUrl extends ClusterUrl>(
    originalTransport: RpcTransportFromClusterUrl<TClusterUrl>,
    url: string,
    { maxBatchSize = DEFAULT_MAX_BATCH_SIZE }: BatchingTransportOptions = {},
): RpcTransportFromClusterUrl<TClusterUrl> => {
    const pendingCalls: PendingCall[] = [];
    let flushScheduled = false;
    let nextId = 1;

    const dispatchBatch = (batch: PendingCall[]) => {
        // Assign sequential ids and build the batch payload.
        const batchPayload = batch.map((call, index) => ({
            ...call.payload,
            id: nextId + index,
        }));
        const idOffset = nextId;
        nextId += batch.length;

        // Combine abort signals: if any individual call aborts, abort the whole batch.
        const controller = new AbortController();
        for (const call of batch) {
            call.signal?.addEventListener('abort', () => controller.abort(), { once: true });
        }

        // Use fetch directly for batch requests because the @solana/kit default
        // transport unwraps the JSON-RPC envelope and cannot handle batch (array)
        // responses. We send the array payload ourselves and demux the responses.
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: stringifyJsonWithBigints(batchPayload),
            signal: controller.signal,
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Batch RPC request failed: ${res.status} ${res.statusText}`);
                }

                return res
                    .text()
                    .then(rawResponse => parseJsonWithBigInts(rawResponse) as JsonRpcResponse[]);
            })
            .then(responses => {
                const byId = new Map<number, JsonRpcResponse>();
                for (const r of responses) {
                    byId.set(Number(r.id), r);
                }

                for (let i = 0; i < batch.length; i++) {
                    const r = byId.get(idOffset + i);
                    if (!r) {
                        batch[i].reject(new Error(`Missing response for batch item ${i}`));
                    } else if ('error' in r) {
                        batch[i].reject(r.error);
                    } else {
                        // Solana RPC clients expect the transport to return the full JSON-RPC
                        // envelope. Their response transformer unwraps `.result` later.
                        batch[i].resolve(r);
                    }
                }
            })
            .catch(error => {
                for (const call of batch) {
                    call.reject(error);
                }
            });
    };

    const flush = () => {
        flushScheduled = false;

        const batch = pendingCalls.splice(0, pendingCalls.length);
        if (batch.length === 0) return;

        // Single call — pass through to the original transport as-is.
        if (batch.length === 1) {
            const call = batch[0];
            originalTransport({ payload: call.payload, signal: call.signal })
                .then(call.resolve)
                .catch(call.reject);

            return;
        }

        // Split into chunks of maxBatchSize.
        for (let i = 0; i < batch.length; i += maxBatchSize) {
            const chunk = batch.slice(i, i + maxBatchSize);
            dispatchBatch(chunk);
        }
    };

    const batchingTransport = <TResponse>(
        config: Parameters<RpcTransportFromClusterUrl<TClusterUrl>>[0],
    ): Promise<TResponse> =>
        new Promise<TResponse>((resolve, reject) => {
            pendingCalls.push({
                payload: config.payload as JsonRpcPayload,
                reject,
                resolve: resolve as (value: unknown) => void,
                signal: config.signal,
            });

            if (!flushScheduled) {
                flushScheduled = true;
                // Flush on the next microtask so all synchronously-queued calls
                // (e.g. from Promise.all) are collected into one batch.
                queueMicrotask(flush);
            }
        });

    return batchingTransport as RpcTransportFromClusterUrl<TClusterUrl>;
};
