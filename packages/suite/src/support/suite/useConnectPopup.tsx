import { useEffect, useRef, useState } from 'react';

import {
    CALL_SOURCE_WEB,
    type ManifestPartial,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import {
    CORE_CALL,
    type CallMethodKeys,
    POPUP,
    RESPONSE_EVENT,
    createPopupMessage,
} from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

/**
 * Normalized incoming message from either the web or webextension popup link.
 */
export type ConnectPopupMessage =
    | { type: 'channel-handshake-request' }
    | {
          type: typeof POPUP.HANDSHAKE;
          id: string;
          payload: { manifest: ManifestPartial };
          version: string;
      }
    | { type: typeof CORE_CALL; id: string; payload: { method: string; [key: string]: unknown } }
    | { type: typeof POPUP.CLOSED; payload?: { error?: string } };

/** Outgoing message shape. */
export type ConnectPopupOutgoingMessage = Record<string, unknown> & { type: string };

/**
 * Link adapter that each caller (web / webextension) must provide.
 * - `sendMessage` — delivers a message to the caller.
 * - `handshakeConfirmMessage` — the full message to send back for a channel-handshake-request.
 *   If omitted, a default `{ type: 'channel-handshake-confirm' }` is sent.
 */
export interface ConnectPopupLink {
    sendMessage: (message: ConnectPopupOutgoingMessage) => void;
    handshakeConfirmMessage?: ConnectPopupOutgoingMessage;
    /** The origin string to use as `source.origin` for the popup call thunk. */
    origin: string;
}

/**
 * Shared hook that implements the common connect popup protocol:
 * channel handshake, POPUP.HANDSHAKE, CORE_CALL dispatch, POPUP.CLOSED,
 * sending POPUP.CORE_LOADED when suite is ready, and replying to handshake.
 *
 * Link-specific concerns (how messages arrive / are sent) are delegated
 * to the `popupLink` parameter. Pass `null` when the link is not yet
 * available (e.g. extensionId not resolved yet) — the hook will be idle.
 */
export const useConnectPopup = (
    popupLink: ConnectPopupLink | null,
    incomingMessages: ConnectPopupMessage[],
    /** Called after the incoming messages slice has been consumed. */
    onMessagesConsumed: () => void,
) => {
    const dispatch = useDispatch();
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const popupCall = useSelector(selectConnectPopupCall);
    const manifest = useRef<ManifestPartial | undefined>(undefined);
    const [pendingHandshake, setPendingHandshake] = useState<string | undefined>();
    const [responseSent, setResponseSent] = useState(false);

    // Process incoming messages.
    useEffect(() => {
        if (!popupLink || incomingMessages.length === 0) return;

        const message = incomingMessages[0];
        onMessagesConsumed();

        const processMessage = async (event: ConnectPopupMessage) => {
            if (event.type === 'channel-handshake-request') {
                popupLink.sendMessage(
                    popupLink.handshakeConfirmMessage ?? { type: 'channel-handshake-confirm' },
                );
            } else if (event.type === POPUP.HANDSHAKE) {
                manifest.current = {
                    ...event.payload.manifest,
                    npmVersion: event.version,
                };
                setPendingHandshake(event.id);
            } else if (event.type === CORE_CALL) {
                if (!manifest.current) {
                    return;
                }

                setResponseSent(false);
                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                const { method, ...params } = event.payload;
                dispatch(
                    connectPopupCallThunk({
                        method: method as CallMethodKeys,
                        payload: params as Parameters<typeof connectPopupCallThunk>[0]['payload'],
                        source: {
                            type: CALL_SOURCE_WEB,
                            origin: popupLink.origin,
                            manifest: manifest.current,
                        },
                    }),
                );

                const response = await deferred.promise;

                popupLink.sendMessage({
                    id: event.id,
                    type: RESPONSE_EVENT,
                    payload: response,
                });

                setResponseSent(true);
            } else if (event.type === POPUP.CLOSED) {
                dispatch(connectPopupCancelThunk(event.payload ?? {}));
            }
        };

        processMessage(message);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incomingMessages, popupLink, dispatch]);

    // Send POPUP.CORE_LOADED when suite lifecycle becomes ready.
    useEffect(() => {
        if (lifecycle.status !== 'ready' || !popupLink) return;

        popupLink.sendMessage(createPopupMessage(POPUP.CORE_LOADED));
    }, [lifecycle.status, popupLink]);

    // Signal to the caller that the popup is done once the call has finished
    // and we have confirmed the response was sent. The caller's Popup class
    // handles this by closing the popup window/tab.
    useEffect(() => {
        if (!popupLink || !responseSent || popupCall?.state !== 'finished') return;

        popupLink.sendMessage({ type: POPUP.CLOSED });
    }, [popupLink, responseSent, popupCall?.state]);

    // Reply to POPUP.HANDSHAKE once suite is ready and we have a pending handshake.
    useEffect(() => {
        if (lifecycle.status !== 'ready' || !pendingHandshake || !popupLink) return;

        popupLink.sendMessage({
            id: pendingHandshake,
            type: POPUP.HANDSHAKE,
        });
        setPendingHandshake(undefined);
    }, [lifecycle.status, pendingHandshake, popupLink]);

    // Fallback: if the caller's Popup class didn't close us after receiving
    // POPUP.CLOSED, close the window ourselves.
    useEffect(() => {
        if (!popupLink || !responseSent || popupCall?.state !== 'finished') return;

        window.close();
    }, [popupLink, responseSent, popupCall?.state]);
};
