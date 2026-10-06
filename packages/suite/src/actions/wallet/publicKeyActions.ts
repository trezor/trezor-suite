import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import { closeModal, openModal, preserveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { showXpubOnDevice } from '@suite-common/wallet-core';

export const openXpubModal =
    (params?: Pick<Extract<UserContextPayload, { type: 'xpub' }>, 'isConfirmed'>) =>
    (dispatch: Dispatch<UnknownAction>) => {
        dispatch(openModal({ type: 'xpub', ...params }));
    };

export type ShowXpubThunkState = DeviceRootState & SelectedAccountRootState;

export const showXpubThunk =
    () =>
    async (
        dispatch: ThunkDispatch<ShowXpubThunkState, unknown, UnknownAction>,
        getState: () => ShowXpubThunkState,
    ) => {
        const device = selectSelectedDevice(getState());
        const account = selectSelectedAccount(getState());

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
