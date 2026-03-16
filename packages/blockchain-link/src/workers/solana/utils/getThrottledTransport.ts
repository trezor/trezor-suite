import { type ClusterUrl, type RpcTransportFromClusterUrl } from '@solana/kit';

const DEFAULT_MAX_RPS = 4; // Default maximum requests per second
const DEFAULT_INTERVAL = 1000; // Default interval in milliseconds (1 second)

type QueuedRequest<TClusterUrl extends ClusterUrl, TResponse = unknown> = Readonly<{
    config: Parameters<RpcTransportFromClusterUrl<TClusterUrl>>[0];
    reject: (reason?: unknown) => void;
    requestNumber: number;
    resolve: (value: TResponse | PromiseLike<TResponse>) => void;
}>;

export type ThrottledTransportOptions = { maxRps?: number; interval?: number; debug?: boolean };

/**
 * Throttled RPC transport for Solana.
 *
 * Based on https://github.com/anza-xyz/kit/blob/main/examples/rpc-transport-throttled/src/example.ts
 *
 * Adds a simple fixed-window queue (token bucket style) that limits requests per second (RPS).
 *
 * Safe for use with createSolanaRpcFromTransport.
 */
export const getThrottledTransport = <TClusterUrl extends ClusterUrl>(
    originalTransport: RpcTransportFromClusterUrl<TClusterUrl>,
    {
        maxRps = DEFAULT_MAX_RPS,
        interval = DEFAULT_INTERVAL,
        debug = false,
    }: ThrottledTransportOptions = {},
): RpcTransportFromClusterUrl<TClusterUrl> => {
    /**
     * Keep track of how many more requests are allowed to be made in the current 1 second span.
     */
    let requestBudgetRemaining = maxRps;
    /**
     * When the first request is made, schedule a reset of the request budget for 1 second from now,
     * and store the timer of that scheduled reset here.
     */
    let pendingQueueRunTimerId: NodeJS.Timeout | undefined;
    /**
     * Keep a queue of requests and resolve/reject functions.
     */
    const queuedRequests: QueuedRequest<TClusterUrl, any>[] = [];
    const processQueue = () => {
        if (requestBudgetRemaining === 0) {
            return;
        }
        if (debug) {
            console.warn('[transport] Processing request queue', {
                numQueuedRequests: queuedRequests.length,
            });
        }
        while (queuedRequests.length && requestBudgetRemaining > 0) {
            const request = queuedRequests.shift()!;
            if (debug) {
                console.warn(`[transport] Processing request ${request.requestNumber}`, {
                    requestBudgetRemaining,
                });
            }
            if (request.config.signal?.aborted) {
                if (debug) {
                    console.warn(`[transport] Skipping aborted request ${request.requestNumber}`);
                }
                continue;
            }
            if (debug) {
                console.warn(`[transport] Starting request ${request.requestNumber}`);
            }
            /**
             * When a request's slot comes up, delegate it to the underlying transport.
             */
            originalTransport(request.config).then(request.resolve).catch(request.reject);
            requestBudgetRemaining--;
            if (pendingQueueRunTimerId === undefined) {
                if (debug) {
                    console.warn(
                        `[transport] Setting request budget reset deadline for ${interval} ms from now`,
                    );
                }
                pendingQueueRunTimerId = setTimeout(() => {
                    if (debug) {
                        console.warn('[transport] Replenishing request budget');
                    }
                    pendingQueueRunTimerId = undefined;
                    requestBudgetRemaining = maxRps;
                    processQueue();
                }, interval);
            }
        }
    };
    let requestCount = 0;

    /**
     * Whenever the throttling transport is called, return a promise for the response, to be
     * resolved by the rate-limiting request queue processor.
     */
    const throttledTransport = <TResponse>(
        config: Parameters<RpcTransportFromClusterUrl<TClusterUrl>>[0],
    ): Promise<TResponse> =>
        new Promise<TResponse>((resolve, reject) => {
            queuedRequests.push({
                config,
                reject,
                requestNumber: ++requestCount,
                resolve,
            });

            if (config.signal) {
                config.signal.addEventListener('abort', function () {
                    reject(this.reason);
                });
            }

            processQueue();
        });

    return throttledTransport as RpcTransportFromClusterUrl<TClusterUrl>;
};
