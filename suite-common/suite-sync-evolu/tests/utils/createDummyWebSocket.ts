import { CreateWebSocket, ok } from '@evolu/common';

export const createDummyWebSocket: CreateWebSocket = () => ({
    send: () => ok(),
    getReadyState: () => 'connecting',
    isOpen: () => false,
    [Symbol.dispose]: () => undefined,
});
