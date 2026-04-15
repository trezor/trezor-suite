import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CORE_CALL, POPUP } from '@trezor/connect';

import {
    type ConnectPopupLink,
    type ConnectPopupMessage,
    type ConnectPopupOutgoingMessage,
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
    const initialUrl = useRef<string>(window.location.href.split('?')[1] ?? '');
    const channelRef = useRef<BroadcastChannel | null>(null);

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
        if (channelRef.current) {
            channelRef.current.postMessage(message);
        } else {
            // TODO: show warning to user
            console.error('BroadcastChannel not available', initialUrl.current);
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
        const urlParams = new URLSearchParams(initialUrl.current);
        const requestId = urlParams.get('connect-popup-req');
        const requestErr = urlParams.get('connect-popup-err');

        if (!requestId && !requestErr) {
            // no id in URL, unable to establish communication channel
            return;
        }

        if (requestErr) {
            // TODO: show warning to user
            console.warn('Popup opened with error', { requestErr });

            return;
        }

        let broadcastChannel: BroadcastChannel | undefined;
        try {
            broadcastChannel = new BroadcastChannel(`@trezor/connect-popup/${requestId}`);
            channelRef.current = broadcastChannel;
        } catch (error) {
            // TODO: show warning to user
            console.warn('BroadcastChannel is not supported in this browser', error);

            return;
        }

        const handshakeTimeout = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            broadcastChannel.removeEventListener('message', onMessage);
            broadcastChannel.close();
            channelRef.current = null;
            // TODO: show warning to user
            console.warn('Popup handshake timeout');
        }, 3000);

        const onMessage = (event: MessageEvent) => {
            const { data } = event;
            if (!data?.type) return;

            if (data.type === 'channel-handshake-request') {
                // another popup with the same channel peer is trying to handshake.
                // close current instance and proceed in new window.
                if (data.channel.peer === '@trezor/connect-bootstrap-popup') {
                    window.close();

                    return;
                }

                if (data.channel.peer === webChannel.here) {
                    clearTimeout(handshakeTimeout);
                    // Remember the actual caller origin (sent by the bootstrap).
                    originRef.current = data.origin;
                }
            }

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

        broadcastChannel.addEventListener('message', onMessage);

        // TODO: replace this with broadcastChannel ping-pong
        const onBeforeUnload = () => {
            broadcastChannel.postMessage({
                type: POPUP.CLOSED,
                channel: webChannel,
            });
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            clearTimeout(handshakeTimeout);
            broadcastChannel.removeEventListener('message', onMessage);
            broadcastChannel.close();
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, []);
};
