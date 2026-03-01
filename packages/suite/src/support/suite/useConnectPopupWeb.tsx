import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CORE_CALL, POPUP } from '@trezor/connect';

import {
    ConnectPopupLink,
    ConnectPopupMessage,
    ConnectPopupOutgoingMessage,
    useConnectPopup,
} from './useConnectPopup';

const webChannel = {
    here: '@trezor/connect-popup',
    peer: '@trezor/connect-web',
};

export const useConnectPopupWeb = () => {
    const [incomingMessages, setIncomingMessages] = useState<ConnectPopupMessage[]>([]);
    // Start with '*' because we don't know the opener's origin yet.
    // Protocol messages sent before the first incoming message (e.g.
    // POPUP.CORE_LOADED, channel-handshake-confirm) contain no sensitive
    // data, so '*' is safe.  Once we receive a message from the caller,
    // originRef is narrowed to the actual event.origin — all subsequent
    // messages (including those carrying addresses / signatures) will be
    // scoped to that origin.
    const originRef = useRef<string>('*');

    /**
     * Send a message back to the caller (opener window or same window).
     *
     * Uses `originRef.current` as the target origin so that responses are only
     * delivered to the window that initiated the connect call. This prevents a
     * malicious opener from a different origin from intercepting sensitive data
     * such as addresses or signatures.
     */
    const postMessageToParent = useCallback((message: ConnectPopupOutgoingMessage) => {
        message.channel = webChannel;
        if (window.opener) {
            window.opener.postMessage(message, originRef.current);
        } else {
            window.postMessage(message, window.location.origin);
        }
    }, []);

    const popupLink = useMemo<ConnectPopupLink>(
        () => ({
            sendMessage: postMessageToParent,
            get origin() {
                return originRef.current;
            },
        }),
        [postMessageToParent],
    );

    const consumeMessages = useCallback(() => {
        setIncomingMessages(prev => prev.slice(1));
    }, []);

    useConnectPopup(popupLink, incomingMessages, consumeMessages);

    // Listen for incoming window messages and normalize them.
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            const { data } = event;
            if (!data?.type) return;

            // Remember the actual caller origin.
            originRef.current = event.origin;

            if (
                data.type === 'channel-handshake-request' ||
                data.type === POPUP.HANDSHAKE ||
                data.type === POPUP.CLOSED ||
                data.type === CORE_CALL
            ) {
                const normalized: ConnectPopupMessage =
                    data.type === POPUP.HANDSHAKE
                        ? {
                              type: data.type,
                              id: data.id,
                              payload: { manifest: data.payload?.manifest },
                              version: data.payload?.version,
                          }
                        : data;
                setIncomingMessages(prev => [...prev, normalized]);
            }
        };

        window.addEventListener('message', onMessage);

        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, []);
};
