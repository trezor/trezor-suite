import { http, webSocket } from 'viem';

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
