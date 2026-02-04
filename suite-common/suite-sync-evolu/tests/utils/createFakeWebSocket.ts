import { CreateWebSocket, ok } from '@evolu/common';

export const createFakeWebSocket: CreateWebSocket = () => ({
    send: () => ok(),
    getReadyState: () => 'connecting',
    isOpen: () => false,
    [Symbol.dispose]: () => undefined,
});
