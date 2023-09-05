import { MODAL } from 'src/actions/suite/constants';

import { DeviceContextModal } from './DeviceContextModal';
import { DeviceConfirmationModal } from './DeviceConfirmationModal';
import { UserContextModal } from './UserContextModal';

import type { ReduxModalProps } from './types';

/** Modals initiated by redux state.modal */
export const ReduxModal = (modal: ReduxModalProps) => {
    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE: // Modals requested by Device from `trezor-connect`
            return <DeviceContextModal {...modal} />;
        case MODAL.CONTEXT_DEVICE_CONFIRMATION: // Modals requested from `trezor-connect`
            return <DeviceConfirmationModal {...modal} />;
        case MODAL.CONTEXT_USER: // Modals opened as result of user action
            return <UserContextModal {...modal} />;
        default:
            return null;
    }
};
