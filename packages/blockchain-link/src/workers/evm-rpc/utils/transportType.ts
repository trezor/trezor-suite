import { http, webSocket } from 'viem';

import { RPC_BATCH_SIZE } from '../constants';

export const getTransportType = (url: string) => {
    switch (true) {
        case url.startsWith('http://'):
        case url.startsWith('https://'):
            return http;
        case url.startsWith('ws://'):
        case url.startsWith('wss://'):
            return webSocket;
        default:
            return null;
    }
};

// Requests made in the same tick share one HTTP request, so a history step's hundreds of
// eth_getLogs cost a couple of round trips instead of one each.
export const getTransport = (url: string) => {
    const transportType = getTransportType(url);

    if (transportType === http) {
        return http(url, { batch: { batchSize: RPC_BATCH_SIZE } });
    }

    return transportType?.(url) ?? null;
};
