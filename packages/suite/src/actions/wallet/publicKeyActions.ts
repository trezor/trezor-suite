import { UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';
import { getDerivationType } from '@suite-common/wallet-utils';

import { onCancel, openModal, preserve } from 'src/actions/suite/modalActions';
import { GetState, Dispatch } from 'src/types/suite';

export const openXpubModal =
    (params?: Pick<Extract<UserContextPayload, { type: 'xpub' }>, 'isConfirmed'>) =>
    (dispatch: Dispatch) => {
        dispatch(openModal({ type: 'xpub', ...params }));
    };

export const showXpub = () => async (dispatch: Dispatch, getState: GetState) => {
    const device = selectDevice(getState());
    const { account } = getState().wallet.selectedAccount;

    if (!device || !account) return;

    // Show warning when device is not connected.
    if (!device.connected || !device.available) {
        dispatch(openModal({ type: 'unverified-xpub' }));
        return;
    }

    // Prevent flickering screen when modal changes.
    dispatch(preserve());

    const params = {
        device,
        path: account.path,
        useEmptyPassphrase: device.useEmptyPassphrase,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
    };

    let response: Success<unknown> | Unsuccessful;

    switch (account.networkType) {
        case 'bitcoin':
            response = await TrezorConnect.getPublicKey(params);
            break;
        case 'cardano':
            response = await TrezorConnect.cardanoGetPublicKey(params);
            break;
        case 'solana':
            response = await TrezorConnect.solanaGetPublicKey(params);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getPublicKey not defined', code: undefined },
            };
    }

    if (response.success) {
        // Show second part of the "confirm XPUB" modal.
        dispatch(openXpubModal({ isConfirmed: true }));
    } else {
        dispatch(onCancel());
        // Special case: closing no-backup warning modal should not show a toast.
        if (response.payload.code === 'Method_PermissionsNotGranted') return;
        dispatch(
            notificationsActions.addToast({
                type: 'verify-xpub-error',
                error: response.payload.error,
            }),
        );
    }
};
