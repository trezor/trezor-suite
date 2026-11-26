import { type Dispatch } from '@reduxjs/toolkit';

import { MODAL_CONTEXT_USER, type ModalRootState, closeModal, selectModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type DeviceUniquePath } from '@trezor/connect';

type CancelSigningModalOnDisconnectThunkState = ModalRootState;

export const cancelSigningModalOnDisconnectThunk =
    (devicePath: DeviceUniquePath) =>
    (dispatch: Dispatch, getState: () => CancelSigningModalOnDisconnectThunkState) => {
        const foreground = selectModal(getState());
        const modal = foreground.stakingDeviceCheck?.background ?? foreground;
        if (modal.context !== MODAL_CONTEXT_USER) return;

        const result = modal.cancelOnDisconnect?.(devicePath);
        if (!result) return;

        dispatch(closeModal());
        if (result === 'cancelled') {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Device disconnected',
                }),
            );
        }
    };
