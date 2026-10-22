import WSWrapper from './ws.native';

const nativeSocket: { readyState: number; close: jest.Mock; onopen?: () => void } = {
    readyState: WSWrapper.CONNECTING,
    close: jest.fn(),
};

describe('WSWrapper (native)', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        nativeSocket.readyState = WSWrapper.CONNECTING;
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

    it('closes a socket which opens after close() was requested and does not emit open', () => {
        const wrapper = new WSWrapper('ws://localhost', undefined, undefined);
        const onOpen = jest.fn();
        wrapper.on('open', onOpen);

        wrapper.close();
        nativeSocket.readyState = WSWrapper.OPEN;
        nativeSocket.onopen?.();

        expect(nativeSocket.close).toHaveBeenCalledTimes(2);
        expect(onOpen).not.toHaveBeenCalled();
    });

    it('emits open when close() was not requested', () => {
        const wrapper = new WSWrapper('ws://localhost', undefined, undefined);
        const onOpen = jest.fn();
        wrapper.on('open', onOpen);

        nativeSocket.readyState = WSWrapper.OPEN;
        nativeSocket.onopen?.();

        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(nativeSocket.close).not.toHaveBeenCalled();
    });
});
