import { useEffect, useState } from 'react';

import {
    CALL_SOURCE_WEB,
    ManifestPartial,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import TrezorConnect, { IFRAME, POPUP, RESPONSE_EVENT, createPopupMessage } from '@trezor/connect';

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
    const [manifest, setManifest] = useState<ManifestPartial | undefined>();

    useEffect(() => {
        if (lifecycle.status !== 'ready') return;

        const onMessage = async (event: MessageEvent) => {
            console.log('onMessage', event.data);
            if (event.data?.type === 'channel-handshake-request') {
                postMessageToParent({ type: 'channel-handshake-confirm' });
            } else if (event.data.type === POPUP.HANDSHAKE) {
                setManifest(event.data.payload.settings.manifest);
                postMessageToParent({
                    id: event.data.id,
                    type: POPUP.HANDSHAKE,
                });
            } else if (event.data?.type === IFRAME.CALL) {
                if (!manifest) return;

                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                dispatch(
                    connectPopupCallThunk({
                        method: event.data.payload.method as keyof typeof TrezorConnect,
                        payload: event.data.payload,
                        source: {
                            type: CALL_SOURCE_WEB,
                            origin: event.origin,
                            manifest,
                        },
                    }),
                );
                const response = await deferred.promise;
                postMessageToParent({
                    id: event.data.id,
                    type: RESPONSE_EVENT,
                    payload: response,
                });
            } else if (event.data?.type === POPUP.CLOSED) {
                dispatch(connectPopupCancelThunk(event.data.payload));
            }
        };

        window.addEventListener('message', onMessage);

        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [dispatch, manifest, lifecycle.status]);

    useEffect(() => {
        if (lifecycle.status !== 'ready') return;

        postMessageToParent(createPopupMessage(POPUP.CORE_LOADED));
    }, [lifecycle.status]);

    // Window close control
    useEffect(() => {
        if (popupCall?.state === 'finished' && popupCall?.source.type === CALL_SOURCE_WEB) {
            window.close();
        }
    }, [popupCall]);
};
