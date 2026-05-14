import { useEffect, useRef, useState } from 'react';

import { MODAL_CONTEXT_DEVICE, openModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import {
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    getPopupCallDeferred,
    queuePopupCall,
    selectConnectPopupCall,
    selectIsConnectAppSilentModeByOrigin,
} from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import TrezorConnect, {
    type CallMethodKeys,
    type CallMethodPayload,
    UI_REQUEST,
} from '@trezor/connect';
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
            // Only these methods are allowed to bypass the connect-popup UI.
            // Everything else must go through the full approval flow to prevent
            // a caller from silently signing transactions or extracting keys.
            const SILENT_ALLOWED_METHODS = new Set(['getAccountInfo', 'blockchainEstimateFee']);

            desktopApi.on('connect-popup/call', async params => {
                // Silent calls bypass the connect-popup flow entirely and call
                // TrezorConnect directly. Used for data-fetching methods like
                // getAccountInfo and blockchainEstimateFee that don't need
                // device interaction or user confirmation.
                if (params.silent && SILENT_ALLOWED_METHODS.has(params.method)) {
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
                        const { method: _m, device: _d, ...safePayload } = params.payload ?? {};
                        const response = await TrezorConnect.call({
                            method: params.method,
                            ...deviceParams,
                            ...safePayload,
                        } as CallMethodPayload);
                        desktopApi.connectPopupResponse({
                            ...response,
                            id: params.id,
                        });
                    } catch (error) {
                        desktopApi.connectPopupResponse({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                            payload: error instanceof Error ? error.message : String(error),
                            id: params.id,
                        });
                    }

                    return;
                }

                await queuePopupCall();
                const deferred = getPopupCallDeferred(true);
                const isMcp = params.sourceType === CALL_SOURCE_MCP;
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
    const callOrigin = popupCall && 'source' in popupCall ? popupCall.source.origin : undefined;
    const isSilentMode = useSelector(state =>
        selectIsConnectAppSilentModeByOrigin(state, callOrigin),
    );
    // True when Suite is showing a modal that needs user input (passphrase,
    // PIN, recovery word). Silent mode still focuses the window in these cases
    // because the user can't respond to the device without seeing Suite.
    const isUserInputModalOpen = useSelector(state => {
        const { modal } = state;
        if (modal.context !== MODAL_CONTEXT_DEVICE) return false;
        if (!('windowType' in modal) || !modal.windowType) return false;

        return (
            [
                UI_REQUEST.REQUEST_PIN,
                UI_REQUEST.INVALID_PIN,
                UI_REQUEST.REQUEST_PASSPHRASE,
                UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE,
                UI_REQUEST.REQUEST_WORD,
            ] as string[]
        ).includes(modal.windowType);
    });

    const [currentlyOngoing, setCurrentlyOngoing] = useState(false);
    const [wasVisible, setWasVisible] = useState(false);
    useEffect(() => {
        const shouldFocus = (() => {
            if (!popupCall) return false;
            if (popupCall.state === 'permission-request') return true;
            if (popupCall.state === 'address-confirmation') return true;
            if (popupCall.state === 'ongoing' && popupCall.methodInfo.useUi) {
                // Silent mode only focuses when the user has to type something
                // into Suite (passphrase/PIN/word). Device-side confirmations
                // and simple ongoing calls stay in the background.
                return !isSilentMode || isUserInputModalOpen;
            }

            return false;
        })();

        if (shouldFocus) {
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
            // Only hide if we actually focused during this call, otherwise
            // we'd hide a window the user was using before the call started.
            if (currentlyOngoing && !wasVisible) {
                desktopApi.appHide();
            }
            setCurrentlyOngoing(false);
        }
    }, [popupCall, currentlyOngoing, wasVisible, isSilentMode, isUserInputModalOpen]);
};
