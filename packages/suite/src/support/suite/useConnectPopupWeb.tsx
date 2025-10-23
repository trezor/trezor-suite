import { useEffect } from 'react';

import {
    CALL_SOURCE_WEB,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import TrezorConnect from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const useConnectPopupWeb = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const lifecycle = useSelector(state => state.suite.lifecycle);

    useEffect(() => {
        if (lifecycle.status !== 'ready' || !window.opener) return;

        const onMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'connect-popup/call') {
                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                dispatch(
                    connectPopupCallThunk({
                        method: event.data.method as keyof typeof TrezorConnect,
                        payload: event.data.payload,
                        source: {
                            type: CALL_SOURCE_WEB,
                            origin: event.origin,
                            manifest: event.data.manifest,
                        },
                    }),
                );
                const response = await deferred.promise;
                window.opener?.postMessage(
                    { ...response, type: 'connect-popup/response', id: event.data.id },
                    '*',
                );
            }
            if (event.data?.type === 'connect-popup/cancel') {
                dispatch(connectPopupCancelThunk(event.data.payload));
            }
        };

        window.opener?.postMessage({ type: 'connect-popup/ready' }, '*');

        window.addEventListener('message', onMessage);

        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [dispatch, lifecycle.status]);

    // Window close control
    useEffect(() => {
        if (popupCall?.state === 'finished' && popupCall?.source.type === CALL_SOURCE_WEB) {
            window.close();
        }
    }, [popupCall]);
};
