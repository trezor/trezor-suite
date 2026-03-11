import { useEffect, useRef, useState } from 'react';

import { openModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import {
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { CALL_SOURCE_DESKTOP_WS } from '@suite-common/connect-popup/src/connectPopupTypes';
import { CallMethodKeys } from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const useConnectPopupDesktop = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const popupCall = useSelector(selectConnectPopupCall);
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const initialized = useRef(false);

    useEffect(() => {
        const init = async () => {
            if (lifecycle.status !== 'ready') return;
            if (!desktopApi.available || !(await desktopApi.connectPopupEnabled())) return;
            desktopApi.on('connect-popup/call', async params => {
                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                dispatch(
                    connectPopupCallThunk({
                        method: params.method as CallMethodKeys,
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
                );
                const response = await deferred.promise;
                if (response.success) {
                    desktopApi.connectPopupResponse({ ...response, id: params.id });
                } else {
                    desktopApi.connectPopupResponse({
                        success: false,
                        error: response.error,
                        payload: response.error, // for backward compatibility with v9
                        id: params.id,
                    });
                }
            });
            desktopApi.on('connect-popup/cancel', params => {
                dispatch(connectPopupCancelThunk(params));
            });
            desktopApi.on('app/auto-start/popup-request', () => {
                dispatch(openModal({ type: 'auto-start-before-quit' }));
            });

            // Prevent multiple initializations
            if (!initialized.current) {
                initialized.current = true;

                desktopApi.connectPopupReady();

                analytics.report({
                    type: events.connectPopupInitEvent.name,
                });
            }
        };
        init();

        return () => {
            if (desktopApi.available) {
                desktopApi.removeAllListeners('connect-popup/call');
                desktopApi.removeAllListeners('connect-popup/cancel');
                desktopApi.removeAllListeners('app/auto-start/popup-request');
            }
        };
    }, [dispatch, analytics, lifecycle.status]);

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
            desktopApi.appIsVisible().then(isVisible => {
                setWasVisible(isVisible && document.visibilityState === 'visible');
                desktopApi.appFocus();
            });
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
