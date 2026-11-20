import WSWrapper from './ws.browser';

const nativeSocket = { readyState: WSWrapper.CONNECTING, close: jest.fn() };

describe('WSWrapper (browser)', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        nativeSocket.close.mockClear();
        globalThis.WebSocket = jest.fn(() => nativeSocket) as unknown as typeof WebSocket;
    });

    afterAll(() => {
        globalThis.WebSocket = originalWebSocket;
    });

    it.each([
        ['CONNECTING', WSWrapper.CONNECTING, true],
        ['OPEN', WSWrapper.OPEN, true],
        ['CLOSING', WSWrapper.CLOSING, false],
        ['CLOSED', WSWrapper.CLOSED, false],
    ])('close() while %s', (_state, readyState, isForwarded) => {
        const wrapper = new WSWrapper('ws://localhost', undefined, undefined);
        nativeSocket.readyState = readyState;

        wrapper.close();

        expect(nativeSocket.close).toHaveBeenCalledTimes(isForwarded ? 1 : 0);
    });
});
