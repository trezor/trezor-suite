import { http, webSocket } from 'viem';

import { prioritizeEndpoints } from '../../utils';
import { RPC_BATCH_SIZE } from '../constants';

export const isWebSocketUrl = (url: string) => url.startsWith('ws://') || url.startsWith('wss://');

// HTTP batches requests and a WebSocket cannot, so a WebSocket endpoint serves requests only when no
// HTTP one does, and is otherwise kept for subscriptions.
export const orderEndpointsForRequests = (urls: string[]) => [
    ...prioritizeEndpoints(urls.filter(url => !isWebSocketUrl(url))),
    ...prioritizeEndpoints(urls.filter(isWebSocketUrl)),
];

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
