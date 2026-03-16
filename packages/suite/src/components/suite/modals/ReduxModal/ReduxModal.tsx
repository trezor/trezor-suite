import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    type MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
} from '@suite/modal';

import type { AppState } from 'src/types/suite';

import { DeviceConfirmationModal } from './DeviceConfirmationModal/DeviceConfirmationModal';
import { DeviceContextModal } from './DeviceContextModal/DeviceContextModal';
import { UserContextModal } from './UserContextModal/UserContextModal';

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL_CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }>;

/** Modals initiated by redux state.modal */
export const ReduxModal = (modal: ReduxModalProps) => {
    switch (modal.context) {
        case MODAL_CONTEXT_DEVICE: // Modals requested by Device from `trezor-connect`
            return <DeviceContextModal {...modal} />;
        case MODAL_CONTEXT_DEVICE_CONFIRMATION: // Modals requested from `trezor-connect`
            return <DeviceConfirmationModal {...modal} />;
        case MODAL_CONTEXT_USER: // Modals opened as result of user action
            return <UserContextModal {...modal} />;
        default:
            return null;
    }
};
