import { useEffect } from 'react';

import { useFreshRef } from './useFreshRef';

type UseWindowMessagesProps = {
    enabled?: boolean;

    /**
     * Doesn't have to be stable across renders.
     */
    onMessage: (message: unknown, event: MessageEvent) => void;

    targetWindow?: Window | null;
    /**
     * __Due to security, prefer using specific origin to avoid receiving messages from other sources.__
     */
    targetOrigin?: string | '*';

    /**
     * Cancel the subscription.
     */
    signal?: AbortSignal;
};

export function useWindowMessages({
    onMessage,
    targetWindow = window,
    targetOrigin,
    enabled = Boolean(targetOrigin),
    signal,
}: UseWindowMessagesProps) {
    const onMessageRef = useFreshRef(onMessage);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!(targetWindow && event.source === targetWindow && enabled)) {
                return;
            }

            if (!(targetOrigin === '*' || event.origin === targetOrigin)) {
                return;
            }

            onMessageRef.current(event.data, event);
        };

        if (enabled) {
            window.addEventListener('message', handleMessage, { signal });
        }

        return () => window.removeEventListener('message', handleMessage);
    }, [onMessageRef, targetOrigin, targetWindow, signal, enabled]);
}
