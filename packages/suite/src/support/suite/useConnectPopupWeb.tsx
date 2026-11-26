import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    ORIGIN_MISSING_ERROR,
    connectPopupActions,
    isEstablishedOrigin,
} from '@suite-common/connect-popup';
import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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

const BOOTSTRAP_POPUP_PEER = '@trezor/connect-bootstrap-popup';

// The channel of a message from connect-web to the popup, which is the only one the bootstrap
// iframe forwards from the caller.
const isMessageFromCaller = (data: { channel?: { here?: unknown; peer?: unknown } }) =>
    data.channel?.here === webChannel.peer && data.channel?.peer === webChannel.here;

export const useConnectPopupWeb = () => {
    const { dispatch } = useServices(injectDispatch);
    const [incomingMessages, setIncomingMessages] = useState<ConnectPopupMessage[]>([]);
    // The origin of the caller. Starts with '*' because the popup does not know it yet: only the
    // handshake of connect-web tells it, with the `origin` that the bootstrap iframe verified (its
    // `event.origin`, never what the caller claims) and stamped on every message it forwards. Until
    // then the link is unidentified and `onMessage` passes on no call, so '*' never names a caller.
    // Protocol messages sent before (e.g. POPUP.CORE_LOADED, channel-handshake-confirm) contain no
    // sensitive data.
    const originRef = useRef<string>('*');
    const initialUrl = useRef<string>(window.location.href.split('?')[1] ?? '');
    const [broadcast, setBroadcast] = useState<BroadcastChannel | null>(null);

    // Messages to the caller go over the BroadcastChannel, which only the same origin can join. The
    // bootstrap iframe forwards them to the window of the caller with the origin it verified as the
    // target, so the popup does not choose where a response is delivered.
    const popupLink = useMemo<ConnectPopupLink | null>(() => {
        if (!broadcast) return null;

        return {
            sendMessage: (message: ConnectPopupOutgoingMessage) => {
                message.channel = webChannel;
                broadcast.postMessage(message);
            },
            get origin() {
                return originRef.current;
            },
        };
    }, [broadcast]);

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
            dispatch(
                connectPopupActions.setError({
                    code: 'Handshake_Error',
                    message: requestErr,
                }),
            );

            return;
        }

        let broadcastChannel: BroadcastChannel | undefined;
        try {
            broadcastChannel = new BroadcastChannel(`@trezor/connect-popup/${requestId}`);
            setBroadcast(broadcastChannel);
        } catch {
            dispatch(
                connectPopupActions.setError({
                    code: 'Popup_ConnectionMissing',
                    message: 'BroadcastChannel is not supported in this browser',
                }),
            );

            return;
        }

        const handshakeTimeout = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            broadcastChannel.removeEventListener('message', onMessage);
            broadcastChannel.close();
            setBroadcast(null);
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

            // another popup with the same channel peer is trying to handshake.
            // close current instance and proceed in new window.
            if (
                data.type === 'channel-handshake-request' &&
                data.channel?.peer === BOOTSTRAP_POPUP_PEER
            ) {
                window.close();

                return;
            }

            // Nothing else than what connect-web sent to the popup is the caller's.
            if (!isMessageFromCaller(data)) return;

            if (data.type === 'channel-handshake-request') {
                if (!isEstablishedOrigin(data.origin)) {
                    // The caller cannot be named, so its handshake is not passed on to be confirmed.
                    // Once another one has identified the link, this message is not a part of its
                    // call and must not replace it with an error.
                    if (!isEstablishedOrigin(originRef.current)) {
                        clearTimeout(handshakeTimeout);
                        dispatch(
                            connectPopupActions.setError({
                                code: 'Handshake_Error',
                                message: ORIGIN_MISSING_ERROR,
                            }),
                        );
                    }

                    return;
                }

                // The link belongs to the caller that identified it first.
                if (isEstablishedOrigin(originRef.current) && originRef.current !== data.origin) {
                    return;
                }

                clearTimeout(handshakeTimeout);
                originRef.current = data.origin;
            }

            // A call is attributed to the origin of the link, so only a message the bootstrap
            // verified to come from it may start one. Withdrawing a call grants nothing and needs
            // no identified caller.
            if (
                (data.type === POPUP.HANDSHAKE || data.type === CORE_CALL) &&
                (!isEstablishedOrigin(originRef.current) || data.origin !== originRef.current)
            ) {
                return;
            }

            if (
                data.type === 'channel-handshake-request' ||
                data.type === POPUP.HANDSHAKE ||
                data.type === POPUP.CLOSED ||
                data.type === CORE_CALL_CANCEL ||
                data.type === CORE_CALL
            ) {
                const message: ConnectPopupMessage = data;
                setIncomingMessages(prev => [...prev, message]);
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
    }, [dispatch]);
};
