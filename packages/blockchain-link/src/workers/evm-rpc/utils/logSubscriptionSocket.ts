import { type LogTopic, webSocket } from 'viem';

import type { RawLog } from '../history/logScanner';

export type SubscribeLogsParams = {
    topics: LogTopic[];
    onLog: (log: RawLog) => void;
    onError: (error: unknown) => void;
};

export type LogSubscriptionSocket = {
    /** Resolves once the provider confirmed the subscription, with a function that cancels it. */
    subscribeLogs: (params: SubscribeLogsParams) => Promise<() => void>;
    getBlockNumber: () => Promise<number>;
    close: () => void;
};

let openedSockets = 0;

/**
 * A socket used only to be told about new logs. viem's keep-alive is a billed `net_version` every
 * 30 s, and its reconnect re-subscribes without saying what it missed, so both are off: the caller
 * checks the socket is alive by itself and catches up over HTTP once it is gone.
 */
export const openLogSubscriptionSocket = (url: string): LogSubscriptionSocket => {
    // viem shares a socket between transports with equal settings, and closing it closes it for all
    // of them. Every wallet gets a worker instance of its own, and on desktop they share a process.
    const key = `evm-rpc-logs-${++openedSockets}`;
    const transport = webSocket(url, { key, keepAlive: false, reconnect: false, retryCount: 0 })(
        {},
    );
    let isOpened = false;

    return {
        subscribeLogs: async ({ topics, onLog, onError }) => {
            isOpened = true;
            const { unsubscribe } = await transport.value!.subscribe({
                params: ['logs', { topics }],
                // Typed as a whole response, but what arrives is the `eth_subscription` params.
                onData: data => {
                    const { result } = data as { result?: RawLog };
                    if (result) onLog(result);
                },
                onError,
            });

            // The provider may never answer once the socket is on its way out, so nobody waits.
            return () => {
                unsubscribe().catch(() => {});
            };
        },
        getBlockNumber: async () => {
            isOpened = true;

            return Number(await transport.request({ method: 'eth_blockNumber' }));
        },
        close: () => {
            if (!isOpened) return;

            transport
                .value!.getRpcClient()
                .then(rpcClient => rpcClient.close())
                .catch(() => {});
        },
    };
};
