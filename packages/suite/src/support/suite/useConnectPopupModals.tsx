import { useEffect } from 'react';

import {
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
    closeModal as cancelModal,
    openModal,
    selectModalType,
} from '@suite/modal';
import { connectPopupCallThunkInner, selectConnectPopupCall } from '@suite-common/connect-popup';
import { isDiscoveryInProgress, selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

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
                'tx-simulation',
            ].includes(modalType);

        const openIfNeeded = (
            type:
                | 'connect-popup'
                | 'connect-loading'
                | 'connect-address-confirmation'
                | 'connect-error'
                | 'tx-simulation',
        ) => {
            // Prevent duplicate opening of the same modal
            // And also prevent opening connect modals if different modal is already open
            if (modalType !== type && (modalContext === MODAL_CONTEXT_NONE || isConnectModal)) {
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
            case 'tx-simulation': {
                return openIfNeeded('tx-simulation');
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
                    dispatch(cancelModal());
                    dispatch(
                        goto('suite-switch-device', {
                            params: {
                                cancelable: true,
                            },
                        }),
                    );
                }

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
