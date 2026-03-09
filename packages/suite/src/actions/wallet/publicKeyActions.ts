import { closeModal, openModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { showXpubOnDevice } from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';

export const openXpubModal =
    (params?: Pick<Extract<UserContextPayload, { type: 'xpub' }>, 'isConfirmed'>) =>
    (dispatch: Dispatch) => {
        dispatch(openModal({ type: 'xpub', ...params }));
    };

export const showXpub = () => async (dispatch: Dispatch, getState: GetState) => {
    const device = selectSelectedDevice(getState());
    const { account } = getState().wallet.selectedAccount;

    if (!device || !account) return;

    // Show warning when device is not connected.
    if (!device.connected || !device.available) {
        dispatch(openModal({ type: 'unverified-xpub' }));

        return;
    }

    // Prevent flickering screen when modal changes.
    dispatch(preserveModal());

    const response = await showXpubOnDevice(device, account);

    if (response.success) {
        // Show second part of the "confirm XPUB" modal.
        dispatch(openXpubModal({ isConfirmed: true }));
    } else {
        dispatch(closeModal());
        // Special case: closing no-backup warning modal should not show a toast.
        if (response.error.code === 'Method_PermissionsNotGranted') return;
        dispatch(
            notificationsActions.addToast({
                type: 'verify-xpub-error',
                error: response.error.message,
            }),
        );
    }
};
