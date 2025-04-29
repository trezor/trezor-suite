import { useEffect, useState } from 'react';

import {
    connectPopupCallThunk,
    connectPopupCancelThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { CALL_SOURCE_DESKTOP_WS } from '@suite-common/connect-popup/src/connectPopupTypes';
import TrezorConnect from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useConnectPopupDesktop = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);

    useEffect(() => {
        const init = async () => {
            if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
                desktopApi.on('connect-popup/call', async params => {
                    const response = await dispatch(
                        connectPopupCallThunk({
                            method: params.method as keyof typeof TrezorConnect,
                            payload: params.payload,
                            source: {
                                type: CALL_SOURCE_DESKTOP_WS,
                                process: params.process ?? {
                                    name: 'Unknown',
                                    fullPath: 'Unknown',
                                    warning: true,
                                },
                                origin: params.origin,
                                manifest: params.manifest,
                            },
                        }),
                    ).unwrap();
                    desktopApi.connectPopupResponse({ ...response, id: params.id });
                });
                desktopApi.on('connect-popup/cancel', params => {
                    dispatch(connectPopupCancelThunk(params));
                });
                desktopApi.on('app/auto-start/popup-request', () => {
                    dispatch(openModal({ type: 'auto-start-before-quit' }));
                });
                desktopApi.connectPopupReady();
            }
        };
        init();

        return () => {
            if (desktopApi.available) {
                desktopApi.removeAllListeners('connect-popup/call');
                desktopApi.removeAllListeners('connect-popup/cancel');
            }
        };
    }, [dispatch]);

    // App focus control
    const [currentlyOngoing, setCurrentlyOngoing] = useState(false);
    const [wasVisible, setWasVisible] = useState(false);
    useEffect(() => {
        if (
            // Permission request
            popupCall?.state === 'permission-request' ||
            // Call ongoing - show only if method uses UI
            (popupCall?.state === 'ongoing' && popupCall?.methodInfo.useUi)
        ) {
            // Only trigger once
            if (currentlyOngoing) return;

            setCurrentlyOngoing(true);
            // Remember visibility state
            desktopApi.appIsVisible().then(isVisible => setWasVisible(isVisible));
            desktopApi.appFocus();
        }

        if (popupCall?.state === 'finished') {
            setCurrentlyOngoing(false);
            // Once finished, hide app if it was not visible before
            if (!wasVisible) {
                desktopApi.appHide();
            }
        }
    }, [popupCall, currentlyOngoing, wasVisible]);
};
