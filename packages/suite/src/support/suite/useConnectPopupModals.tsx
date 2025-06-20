import { useEffect } from 'react';

import { selectConnectPopupCall } from '@suite-common/connect-popup';

import { CONTEXT_NONE, CONTEXT_USER } from 'src/actions/suite/constants/modalConstants';
import { onCancel as cancelModal, openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';

export const useConnectPopupModals = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);

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
