import { useEffect, useRef, useState } from 'react';

import {
    connectPopupCallThunk,
    connectPopupCancelThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { CALL_SOURCE_DESKTOP_WS } from '@suite-common/connect-popup/src/connectPopupTypes';
import TrezorConnect from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';

import { SUITE } from 'src/actions/suite/constants';
import { CONTEXT_NONE, CONTEXT_USER } from 'src/actions/suite/constants/modalConstants';
import { onCancel as cancelModal, openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';

export const useConnectPopupDesktop = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const experimentalFeatures = useSelector(state => state.suite.settings.experimental);
    const initialized = useRef(false);

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

                // Prevent multiple initializations
                if (!initialized.current) {
                    initialized.current = true;

                    desktopApi.connectPopupReady();

                    analytics.report({
                        type: EventType.ConnectPopupInit,
                    });

                    // Update experimental features value
                    // TODO: remove this when out of experimental
                    if (!experimentalFeatures?.includes('trezor-connect-ws')) {
                        dispatch({
                            type: SUITE.SET_EXPERIMENTAL_FEATURES,
                            payload: {
                                enabledFeatures: [
                                    ...(experimentalFeatures ?? []),
                                    'trezor-connect-ws',
                                ],
                            },
                        });
                    }
                }
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
    }, [dispatch, experimentalFeatures]);

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

    // Modal opening control
    const modalContext = useSelector(state => state.modal.context);
    const modalType = useSelector(selectModalType);
    useEffect(() => {
        const isConnectModal =
            modalContext === CONTEXT_USER &&
            modalType &&
            [
                'connect-popup',
                'connect-loading',
                'connect-address-confirmation',
                'connect-error',
            ].includes(modalType);

        const openIfNeeded = (
            type:
                | 'connect-popup'
                | 'connect-loading'
                | 'connect-address-confirmation'
                | 'connect-error',
        ) => {
            // Prevent duplicate opening of the same modal
            // And also prevent opening connect modals if different modal is already open
            if (modalType !== type && (modalContext === CONTEXT_NONE || isConnectModal)) {
                dispatch(openModal({ type }));
            }
        };

        switch (popupCall?.state) {
            case 'permission-request': {
                return openIfNeeded('connect-popup');
            }
            case 'ongoing': {
                return openIfNeeded('connect-loading');
            }
            case 'address-confirmation': {
                return openIfNeeded('connect-address-confirmation');
            }
            case 'error':
            case 'call-error': {
                return openIfNeeded('connect-error');
            }
            case 'deeplink-callback': {
                // Not used on desktop
                return;
            }
            case 'finished':
            default: {
                if (isConnectModal) {
                    dispatch(cancelModal());
                }

                return;
            }
        }
    }, [popupCall?.state, modalType, modalContext, dispatch]);
};
