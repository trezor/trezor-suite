import { useEffect } from 'react';

import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
    closeModal as cancelModal,
    openModal,
    preserveModal,
    removePreserveModal,
    selectModalType,
} from '@suite/modal';
import { goto, selectRouteName } from '@suite/router';
import {
    connectPopupActions,
    connectPopupCallThunkInner,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { isDiscoveryInProgress, selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useConnectPopupModals = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const discovery = useSelector(selectDiscoveryForSelectedDevice);
    const isInDiscoveryFlow = isDiscoveryInProgress(discovery);

    // Modal opening control
    const modalContext = useSelector(state => state.modal.context);
    const modalType = useSelector(selectModalType);
    const activeRoute = useSelector(selectRouteName);
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    useEffect(() => {
        const isConnectModal =
            modalContext === MODAL_CONTEXT_USER &&
            modalType &&
            [
                'connect-popup',
                'connect-loading',
                'connect-address-confirmation',
                'connect-error',
                'connect-popup-tx-simulation',
            ].includes(modalType);

        // During a connect popup call the device may request interaction
        // (e.g. REQUEST_BUTTON / REQUEST_PIN).  This replaces the current
        // MODAL_CONTEXT_USER modal with a MODAL_CONTEXT_DEVICE modal that
        // inherits preserve=true.  After the device interaction finishes,
        // CLOSE_UI_WINDOW is blocked by preserve, leaving the device modal
        // on screen.  We must allow connect modals to replace these stale
        // device modals, otherwise the error/loading modal never opens.
        const isReplaceableByConnectModal =
            isConnectModal ||
            modalContext === MODAL_CONTEXT_DEVICE ||
            modalContext === MODAL_CONTEXT_DEVICE_CONFIRMATION;

        const openIfNeeded = (
            type:
                | 'connect-popup'
                | 'connect-loading'
                | 'connect-address-confirmation'
                | 'connect-error'
                | 'connect-popup-tx-simulation',
        ) => {
            // Prevent duplicate opening of the same modal
            // And also prevent opening connect modals if different modal is already open
            if (
                modalType !== type &&
                (modalContext === MODAL_CONTEXT_NONE || isReplaceableByConnectModal)
            ) {
                dispatch(openModal({ type }));
                // Prevent UI_REQUEST.CLOSE_UI_WINDOW from unrelated TrezorConnect
                // calls (e.g. discovery finishing in the background) from closing
                // the connect popup modal.
                dispatch(preserveModal());
            }
        };

        switch (popupCall?.state) {
            case 'permission-request': {
                return openIfNeeded('connect-popup');
            }
            case 'ongoing': {
                // During device interaction it opens a
                // MODAL_CONTEXT_DEVICE modal (e.g. "confirm on device").
                // Don't replace it with the generic loading spinner.
                if (
                    modalContext === MODAL_CONTEXT_DEVICE ||
                    modalContext === MODAL_CONTEXT_DEVICE_CONFIRMATION
                ) {
                    return;
                }

                return openIfNeeded('connect-loading');
            }
            case 'address-confirmation': {
                return openIfNeeded('connect-address-confirmation');
            }
            case 'tx-simulation': {
                return openIfNeeded('connect-popup-tx-simulation');
            }
            case 'error':
            case 'call-error': {
                return openIfNeeded('connect-error');
            }
            case 'deeplink-callback': {
                // Not used on desktop
                return;
            }
            case 'switch-device': {
                if (modalContext !== MODAL_CONTEXT_NONE && !isInDiscoveryFlow) {
                    TrezorConnect.cancel('switching-device');
                    dispatch(removePreserveModal());
                    dispatch(cancelModal());
                    dispatch(
                        goto({
                            routeName: 'suite-switch-device',
                            params: {
                                cancelable: true,
                            },
                        }),
                    );
                }

                return;
            }
            case 'finished': {
                // A connect popup call has completed — close the connect
                // modal or any stale device modal left over from a device
                // interaction during the call (preserve blocked its close).
                if (isReplaceableByConnectModal) {
                    dispatch(removePreserveModal());
                    dispatch(cancelModal());
                }
                // Clear state after allowing everything to update
                setTimeout(() => {
                    dispatch(connectPopupActions.clearCall());
                }, 100);

                return;
            }
            default: {
                // No active popup call — only clean up orphaned connect
                // modals.  Do NOT close device modals here, they are
                // unrelated to the connect popup flow.
                if (isConnectModal) {
                    dispatch(removePreserveModal());
                    dispatch(cancelModal());
                }

                return;
            }
        }
    }, [popupCall?.state, modalType, modalContext, activeRoute, dispatch, isInDiscoveryFlow]);

    // Restart thunk once device is selected
    useEffect(() => {
        if (
            popupCall?.state === 'switch-device' &&
            activeRoute !== 'suite-switch-device' &&
            // This check prevents restarting the call immediately after it was created, since the route may not be updated yet
            popupCall?.timestamp < Date.now() - 500 &&
            // Wait for discovery user flow to finish
            !isInDiscoveryFlow &&
            !isConnectionModalOpen
        ) {
            dispatch(
                connectPopupCallThunkInner({
                    ...popupCall,
                }),
            );
        }
    }, [popupCall, activeRoute, dispatch, isInDiscoveryFlow, isConnectionModalOpen]);
};
