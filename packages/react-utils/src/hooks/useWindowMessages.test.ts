import { renderHook } from '@testing-library/react';

import { useWindowMessages } from './useWindowMessages';

const targetOrigin = 'https://app.trezor.io';
const otherOrigin = 'https://evil.example';

type DispatchMessageParams = {
    data: unknown;
    origin?: string;
    source?: Window | null;
};

const dispatchMessage = ({
    data,
    origin = targetOrigin,
    source = window,
}: DispatchMessageParams) => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
};

// A nested browsing context is the only way to get a `Window` that is not the
// one the hook listens on.
const createIframeWindow = () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const { contentWindow } = iframe;

    if (!contentWindow) {
        throw new Error('The test environment did not create a browsing context for the iframe.');
    }

    return contentWindow;
};

describe('useWindowMessages', () => {
    afterEach(() => {
        document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
    });

    it('passes the message data and the event to onMessage when the origin matches', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage, targetOrigin }));

        dispatchMessage({ data: { type: 'ping' } });

        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onMessage).toHaveBeenCalledWith({ type: 'ping' }, expect.any(MessageEvent));
    });

    it('ignores messages from another origin', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage, targetOrigin }));

        dispatchMessage({ data: 'spoofed', origin: otherOrigin });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('accepts messages from any origin when targetOrigin is a wildcard', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage, targetOrigin: '*' }));

        dispatchMessage({ data: 'from anywhere', origin: otherOrigin });

        expect(onMessage).toHaveBeenCalledWith('from anywhere', expect.any(MessageEvent));
    });

    it('ignores messages posted by another window than the default target window', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage, targetOrigin }));

        dispatchMessage({ data: 'from an iframe', source: createIframeWindow() });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('delivers only the messages posted by the given targetWindow', () => {
        const onMessage = jest.fn();
        const iframeWindow = createIframeWindow();
        renderHook(() =>
            useWindowMessages({ onMessage, targetOrigin, targetWindow: iframeWindow }),
        );

        dispatchMessage({ data: 'from the current window' });

        expect(onMessage).not.toHaveBeenCalled();

        dispatchMessage({ data: 'from the iframe', source: iframeWindow });

        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onMessage).toHaveBeenCalledWith('from the iframe', expect.any(MessageEvent));
    });

    it('ignores messages when targetWindow is null', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage, targetOrigin, targetWindow: null }));

        dispatchMessage({ data: 'from a window that is not being watched' });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('does not deliver messages when no targetOrigin is given', () => {
        const onMessage = jest.fn();
        renderHook(() => useWindowMessages({ onMessage }));

        dispatchMessage({ data: 'from an unrestricted origin', origin: otherOrigin });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('subscribes and unsubscribes as enabled changes', () => {
        const onMessage = jest.fn();
        const { rerender } = renderHook(
            ({ enabled }) => useWindowMessages({ onMessage, targetOrigin, enabled }),
            { initialProps: { enabled: false } },
        );

        dispatchMessage({ data: 'while disabled' });

        expect(onMessage).not.toHaveBeenCalled();

        rerender({ enabled: true });
        dispatchMessage({ data: 'while enabled' });

        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onMessage).toHaveBeenCalledWith('while enabled', expect.any(MessageEvent));

        rerender({ enabled: false });
        dispatchMessage({ data: 'after being disabled again' });

        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('calls the onMessage callback of the latest render', () => {
        const initialOnMessage = jest.fn();
        const latestOnMessage = jest.fn();
        const { rerender } = renderHook(
            ({ onMessage }) => useWindowMessages({ onMessage, targetOrigin }),
            { initialProps: { onMessage: initialOnMessage } },
        );

        rerender({ onMessage: latestOnMessage });
        dispatchMessage({ data: 'to the latest callback' });

        expect(initialOnMessage).not.toHaveBeenCalled();
        expect(latestOnMessage).toHaveBeenCalledWith(
            'to the latest callback',
            expect.any(MessageEvent),
        );
    });

    it('resubscribes when targetOrigin changes', () => {
        const onMessage = jest.fn();
        const { rerender } = renderHook(
            ({ origin }) => useWindowMessages({ onMessage, targetOrigin: origin }),
            { initialProps: { origin: targetOrigin } },
        );

        rerender({ origin: otherOrigin });
        dispatchMessage({ data: 'to the previous origin', origin: targetOrigin });

        expect(onMessage).not.toHaveBeenCalled();

        dispatchMessage({ data: 'to the current origin', origin: otherOrigin });

        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onMessage).toHaveBeenCalledWith('to the current origin', expect.any(MessageEvent));
    });

    it('stops listening after unmount', () => {
        const onMessage = jest.fn();
        const { unmount } = renderHook(() => useWindowMessages({ onMessage, targetOrigin }));

        unmount();
        dispatchMessage({ data: 'after unmount' });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('stops listening once the signal is aborted', () => {
        const onMessage = jest.fn();
        const abortController = new AbortController();
        renderHook(() =>
            useWindowMessages({ onMessage, targetOrigin, signal: abortController.signal }),
        );

        dispatchMessage({ data: 'before abort' });

        expect(onMessage).toHaveBeenCalledTimes(1);

        abortController.abort();
        dispatchMessage({ data: 'after abort' });

        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when the signal is already aborted', () => {
        const onMessage = jest.fn();
        const abortController = new AbortController();
        abortController.abort();

        renderHook(() =>
            useWindowMessages({ onMessage, targetOrigin, signal: abortController.signal }),
        );

        dispatchMessage({ data: 'to an aborted subscription' });

        expect(onMessage).not.toHaveBeenCalled();
    });
});
