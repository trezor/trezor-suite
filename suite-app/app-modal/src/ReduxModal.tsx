import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_USER,
    type State as ModalState,
} from '@suite/modal';
import { DeviceConfirmationModal, DeviceContextModal, type ReduxModalProps } from '@trezor/suite';

import { UserContextModal } from './UserContextModal';

const renderModal = (modal: ModalState) => {
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

// PIN and passphrase prompts may temporarily cover an in-progress staking form. Keep its
// original React slot mounted so cancellation restores the draft and verification can resume it.
export const ReduxModal = (modal: ReduxModalProps) => {
    const background = modal.stakingDeviceCheck?.background;

    return (
        <>
            {renderModal(background ?? modal)}
            {background && renderModal(modal)}
        </>
    );
};
