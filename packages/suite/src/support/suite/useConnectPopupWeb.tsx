import { useEffect, useRef, useState } from 'react';

import {
    CALL_SOURCE_WEB,
    ManifestPartial,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import {
    CORE_CALL,
    CallMethodKeys,
    POPUP,
    RESPONSE_EVENT,
    createPopupMessage,
} from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

const postMessageToParent = (message: any) => {
    message.channel = {
        here: '@trezor/connect-popup',
        peer: '@trezor/connect-web',
    };
    if (window.opener) {
        window.opener.postMessage(message, '*');
    } else {
        window.postMessage(message, window.location.origin);
    }
};

export const useConnectPopupWeb = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const manifest = useRef<ManifestPartial | undefined>(undefined);
    const [pendingHandshake, setPendingHandshake] = useState<string | undefined>();
    const [responseSent, setResponseSent] = useState(false);

    useEffect(() => {
        const onMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'channel-handshake-request') {
                postMessageToParent({ type: 'channel-handshake-confirm' });
            } else if (
                event.data.type === POPUP.HANDSHAKE &&
                event.data.payload?.settings?.manifest
            ) {
                manifest.current = {
                    ...event.data.payload.settings.manifest,
                    npmVersion: event.data.payload.settings.version,
                };
                setPendingHandshake(event.data.id);
            } else if (event.data?.type === CORE_CALL) {
                if (!manifest.current) {
                    console.warn(
                        'Connect Popup Web: manifest is not set yet, cannot process CORE_CALL',
                    );

                    return;
                }

                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                dispatch(
                    connectPopupCallThunk({
                        method: event.data.payload.method as CallMethodKeys,
                        payload: event.data.payload,
                        source: {
                            type: CALL_SOURCE_WEB,
                            origin: event.origin,
                            manifest: manifest.current,
                        },
                    }),
                );
                const response = await deferred.promise;
                postMessageToParent({
                    id: event.data.id,
                    type: RESPONSE_EVENT,
                    payload: response,
                });
                setResponseSent(true);
            } else if (event.data?.type === POPUP.CLOSED) {
                dispatch(connectPopupCancelThunk(event.data.payload));
            }
        };

        window.addEventListener('message', onMessage);

        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [dispatch]);

    useEffect(() => {
        if (lifecycle.status !== 'ready') return;

        postMessageToParent(createPopupMessage(POPUP.CORE_LOADED));
    }, [lifecycle.status]);

    useEffect(() => {
        // respond to handshake, but only after suite is ready
        if (lifecycle.status !== 'ready' || !pendingHandshake) return;

        postMessageToParent({
            id: pendingHandshake,
            type: POPUP.HANDSHAKE,
        });
    }, [lifecycle.status, pendingHandshake]);

    // Window close control
    useEffect(() => {
        if (
            popupCall?.state === 'finished' &&
            popupCall?.source.type === CALL_SOURCE_WEB &&
            responseSent
        ) {
            window.close();
        }
    }, [popupCall, responseSent]);
};
