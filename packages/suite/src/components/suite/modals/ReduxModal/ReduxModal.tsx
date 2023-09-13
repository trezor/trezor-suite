import { MODAL } from 'src/actions/suite/constants';
import type { AppState } from 'src/types/suite';
import type { ModalProps } from '../Modal/Modal';
import { DeviceContextModal } from './DeviceContextModal/DeviceContextModal';
import { DeviceConfirmationModal } from './DeviceConfirmationModal/DeviceConfirmationModal';
import { UserContextModal } from './UserContextModal/UserContextModal';

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL.CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }> & {
    renderer?: ModalProps['renderer'];
};

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
