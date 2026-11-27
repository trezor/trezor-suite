import { useEffect, useRef, useState } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { openModal, selectDeviceContextWindowType } from '@suite/modal';
import { events } from '@suite-common/analytics';
import {
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    UNKNOWN_PROCESS,
    injectRequestPopupCall,
    selectConnectPopupCall,
    selectIsConnectAppSilentModeByOrigin,
    toConnectV9ErrorPayload,
} from '@suite-common/connect-popup';
import {
    type CallMethodKeys,
    type PermissionRequest,
    UI_EVENTS,
    UI_REQUESTS,
} from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { isMacOs } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { selectSuiteLifecycleStatus } from '#src/selectors/suite/suiteSelectors';

// `connectionId` is undefined for MCP calls, so no connect-ws cancel can match them.
type PendingPopupCall = {
    connectionId?: string;
    // The id the client gave the call, by which its cancel names it. Suite runs the call under an
    // id of its own.
    callId?: string;
    abortController: AbortController;
};

const getClientCallId = (payload: unknown) =>
    typeof payload === 'object' &&
    payload !== null &&
    'callId' in payload &&
    typeof payload.callId === 'string'
        ? payload.callId
        : undefined;

export const useConnectPopupDesktop = () => {
    const { desktopApi, analytics, dispatch, requestPopupCall } = useServices(
        injectDesktopAnalytics,
        injectDispatch,
        injectDesktopApi,
        injectRequestPopupCall,
    );
    const popupCall = useSelector(selectConnectPopupCall);
    const lifecycleStatus = useSelector(selectSuiteLifecycleStatus);
    const initialized = useRef(false);

    const pendingPopupCalls = useRef(new Set<PendingPopupCall>());

    useEffect(() => {
        const init = async () => {
            if (lifecycleStatus !== 'ready') return;
            if (!desktopApi.available || !(await desktopApi.connectPopupEnabled())) return;

            desktopApi.on('connect-popup/call', async params => {
                const isMcp = params.sourceType === CALL_SOURCE_MCP;
                const pendingCall: PendingPopupCall = {
                    connectionId: params.connectionId,
                    callId: getClientCallId(params.payload),
                    abortController: new AbortController(),
                };
                pendingPopupCalls.current.add(pendingCall);
                const response = await requestPopupCall({
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
                              process: params.process ?? UNKNOWN_PROCESS,
                              origin: params.origin,
                              manifest: params.manifest,
                              // Cast across the IPC boundary, same as `params.method` above.
                              requestedPermissions: params.requestedPermissions as
                                  PermissionRequest[] | undefined,
                          },
                    signal: pendingCall.abortController.signal,
                });
                pendingPopupCalls.current.delete(pendingCall);

                if (response.success) {
                    desktopApi.connectPopupResponse({ ...response, id: params.id });
                } else {
                    desktopApi.connectPopupResponse({
                        success: false,
                        error: response.error,
                        payload: toConnectV9ErrorPayload(response.error),
                        id: params.id,
                    });
                }
            });
            desktopApi.on('connect-popup/cancel', ({ connectionId, callId, error }) => {
                // A client cancels only the calls of its own connection: the one it names, or all
                // of them when it names none (a closed connection, an older client).
                pendingPopupCalls.current.forEach(pendingCall => {
                    if (
                        pendingCall.connectionId === connectionId &&
                        (!callId || pendingCall.callId === callId)
                    ) {
                        pendingCall.abortController.abort(error);
                    }
                });
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
    }, [desktopApi, dispatch, analytics, requestPopupCall, lifecycleStatus]);

    // App focus control
    const callOrigin = popupCall && 'source' in popupCall ? popupCall.source.origin : undefined;
    const isSilentMode = useSelector(state =>
        selectIsConnectAppSilentModeByOrigin(state, callOrigin),
    );
    // True when Suite is showing a modal that needs user input (passphrase,
    // PIN, recovery word). Silent mode still focuses the window in these cases
    // because the user can't respond to the device without seeing Suite.
    const windowType = useSelector(selectDeviceContextWindowType);
    const isUserInputModalOpen =
        windowType &&
        isArrayMember(windowType, [
            UI_REQUESTS.REQUEST_PIN,
            UI_EVENTS.PIN_INVALID,
            UI_REQUESTS.REQUEST_PASSPHRASE,
            UI_EVENTS.PASSPHRASE_ON_DEVICE,
            'WordRequestType_Plain',
            'WordRequestType_Matrix9',
            'WordRequestType_Matrix6',
        ]);

    const [currentlyOngoing, setCurrentlyOngoing] = useState(false);
    const [wasVisible, setWasVisible] = useState(false);
    useEffect(() => {
        const shouldFocus = (() => {
            const state = popupCall?.state;
            switch (state) {
                case 'error':
                case 'call-error':
                case 'switch-device':
                case 'permission-request':
                case 'address-confirmation':
                case 'select-account':
                case 'tx-simulation':
                    return true;
                case 'ongoing': {
                    // Silent mode only focuses when the user has to type something
                    // into Suite (passphrase/PIN/word). Device-side confirmations
                    // and simple ongoing calls stay in the background.
                    return popupCall?.methodInfo?.useUi && (!isSilentMode || isUserInputModalOpen);
                }
                case 'finished':
                case 'deeplink-callback':
                case undefined:
                    return false;
                default:
                    return exhaustive(state);
            }
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
                desktopApi.appIsFullScreen().then(isFullScreen => {
                    if (isMacOs() && isFullScreen) return;

                    desktopApi.appHide();
                });
            }
            setCurrentlyOngoing(false);
        }
    }, [desktopApi, popupCall, currentlyOngoing, wasVisible, isSilentMode, isUserInputModalOpen]);
};
