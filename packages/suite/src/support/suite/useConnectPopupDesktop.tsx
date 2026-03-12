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
import {
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
} from '@suite-common/connect-popup/src/connectPopupTypes';
import { selectSelectedDevice } from '@suite-common/device';
import TrezorConnect, { type CallMethodKeys, type CallMethodPayload } from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const useConnectPopupDesktop = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const popupCall = useSelector(selectConnectPopupCall);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceRef = useRef(selectedDevice);
    selectedDeviceRef.current = selectedDevice;
    const lifecycle = useSelector(state => state.suite.lifecycle);
    const initialized = useRef(false);

    useEffect(() => {
        const init = async () => {
            if (lifecycle.status !== 'ready') return;
            if (!desktopApi.available || !(await desktopApi.connectPopupEnabled())) return;
            desktopApi.on('connect-popup/call', async params => {
                // Silent calls bypass the connect-popup flow entirely and call
                // TrezorConnect directly. Used for data-fetching methods like
                // getAccountInfo and blockchainEstimateFee that don't need
                // device interaction or user confirmation.
                if (params.silent) {
                    try {
                        const device = selectedDeviceRef.current;
                        const deviceParams = device
                            ? {
                                  device: {
                                      path: device.path,
                                      instance: device.instance,
                                      state: device.state,
                                      useEmptyPassphrase: device.useEmptyPassphrase,
                                  },
                              }
                            : {};
                        const response = await TrezorConnect.call({
                            method: params.method,
                            ...deviceParams,
                            ...params.payload,
                        } as CallMethodPayload);
                        desktopApi.connectPopupResponse({
                            ...response,
                            id: params.id,
                        });
                    } catch (error) {
                        desktopApi.connectPopupResponse({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                            payload:
                                error instanceof Error ? error.message : String(error),
                            id: params.id,
                        });
                    }

                    return;
                }

                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                const isMcp = params.sourceType === 'mcp';
                dispatch(
                    connectPopupCallThunk({
                        method: params.method as CallMethodKeys,
                        payload: params.payload,
                        source: isMcp
                            ? {
                                  type: CALL_SOURCE_MCP,
                                  process: params.process,
                                  origin: params.origin,
                                  manifest: params.manifest,
                              }
                            : {
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
