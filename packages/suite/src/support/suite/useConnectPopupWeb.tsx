import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { connectPopupActions } from '@suite-common/connect-popup';
import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';

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

const HEARTBEAT_INTERVAL = 2000;

const getWorkerUrl = () =>
    window.location.origin +
    `${process.env.ASSET_PREFIX || ''}/js/workers/connect-popup-shared-worker.js`.replace(
        /\/+/g,
        '/',
    );

interface PopupChannel {
    port: MessagePort;
    close: () => void;
}

export const useConnectPopupWeb = () => {
    const dispatch = useDispatch();
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
    const [channel, setChannel] = useState<PopupChannel | null>(null);

    const popupLink = useMemo<ConnectPopupLink | null>(() => {
        if (!channel) return null;

        return {
            sendMessage: (message: ConnectPopupOutgoingMessage) => {
                message.channel = webChannel;
                channel.port.postMessage(message);
            },
            get origin() {
                return originRef.current;
            },
        };
    }, [channel]);

    const consumeMessages = useCallback(() => {
        setIncomingMessages(prev => prev.slice(1));
    }, []);

    useConnectPopup(popupLink, incomingMessages, consumeMessages);

    // Listen for incoming messages via SharedWorker and normalize them.
    useEffect(() => {
        const urlParams = new URLSearchParams(initialUrl.current);
        const requestId = urlParams.get('connect-popup-req');
        const requestErr = urlParams.get('connect-popup-err');

        if (!requestId && !requestErr) {
            // no id in URL, unable to establish communication channel
            return;
        }

        if (requestErr) {
            dispatch(
                connectPopupActions.setError({
                    code: 'Handshake_Error',
                    message: requestErr,
                }),
            );

            return;
        }

        console.log('Attempting to connect to popup channel with id:', requestId, getWorkerUrl());
        const channelName = `@trezor/connect-popup/${requestId}`;
        let popupChannel: PopupChannel | undefined;
        try {
            if (typeof SharedWorker === 'undefined') {
                throw new Error('SharedWorker is not supported');
            }

            const worker = new SharedWorker(getWorkerUrl());
            worker.port.start();
            worker.port.postMessage({ type: 'channel-join', channelId: channelName });

            const heartbeatInterval = setInterval(() => {
                worker.port.postMessage({ type: 'heartbeat' });
            }, HEARTBEAT_INTERVAL);

            popupChannel = {
                port: worker.port,
                close: () => {
                    clearInterval(heartbeatInterval);
                    worker.port.postMessage({ type: 'channel-leave' });
                    worker.port.close();
                },
            };
            setChannel(popupChannel);
        } catch {
            dispatch(
                connectPopupActions.setError({
                    code: 'Popup_ConnectionMissing',
                    message: 'SharedWorker is not supported in this browser',
                }),
            );

            return;
        }

        const handshakeTimeout = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            popupChannel!.port.removeEventListener('message', onMessage);
            popupChannel!.close();
            setChannel(null);
            dispatch(
                connectPopupActions.setError({
                    code: 'Handshake_Error',
                    message: 'handshake-timeout',
                }),
            );
        }, 3000);

        const onMessage = (event: MessageEvent) => {
            const { data } = event;
            if (!data?.type) return;

            if (data.type === 'peer-disconnected') {
                setIncomingMessages(prev => [...prev, { type: POPUP.CLOSED }]);

                return;
            }

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
                data.type === CORE_CALL_CANCEL ||
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

        popupChannel.port.addEventListener('message', onMessage);

        const onBeforeUnload = () => {
            popupChannel!.port.postMessage({
                type: POPUP.CLOSED,
                channel: webChannel,
            });
        };
        // window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            clearTimeout(handshakeTimeout);
            popupChannel!.port.removeEventListener('message', onMessage);
            popupChannel!.close();
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [dispatch]);
};
