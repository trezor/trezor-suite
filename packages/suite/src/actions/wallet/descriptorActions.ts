import { UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { getDerivationType } from '@suite-common/wallet-utils';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';

import { onCancel, openModal, preserve } from 'src/actions/suite/modalActions';
import { Dispatch, GetState } from 'src/types/suite';

export const openDescriptorBip380Modal =
    (params?: Pick<Extract<UserContextPayload, { type: 'descriptorBip380' }>, 'isConfirmed' |'descriptorBip380'>) =>
    (dispatch: Dispatch) => {
        console.log('openDescriptorBip380Modal');
        dispatch(openModal({ type: 'descriptorBip380', isConfirmed: params?.isConfirmed, descriptorBip380: params?.descriptorBip380 }));
    };

export const showDescriptor = () => async (dispatch: Dispatch, getState: GetState) => {
    console.log('showDescriptor action');
    const device = selectSelectedDevice(getState());
    const { account } = getState().wallet.selectedAccount;
    console.log('account in showDescriptor', account);

    const wallet = getState();
    console.log('wallet in showDescriptor', wallet);
    if (!device || !account) return;

    // Show warning when device is not connected.
    if (!device.connected || !device.available) {
        console.log('Show warning when device is not connected.');
        dispatch(openModal({ type: 'unverified-descriptor' }));

        return;
    }

    // Prevent flickering screen when modal changes.
    console.log('Prevent flickering screen when modal changes.');
    dispatch(preserve());

    const params = {
        device,
        path: account.path,
        useEmptyPassphrase: device.useEmptyPassphrase,
        showOnTrezor: false,
        derivationType: getDerivationType(account.accountType),
        coin: account.symbol, // must be here to distinguish between testnet and regtest
    };

    console.log('params', params);

    let response: Success<unknown> | Unsuccessful;

    switch (account.networkType) {
        case 'bitcoin':
            response = await TrezorConnect.getPublicKey(params);
            console.log('response from getPublicKey', response);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getPublicKey not defined', code: undefined },
            };
    }
    console.log('response in showDescriptor in descriptorActions', response);

    if (response.success && response?.payload?.descriptor) {
        // Show second part of the "confirm descriptor" modal.
        console.log('Show second part of the');
        dispatch(openDescriptorBip380Modal({ isConfirmed: true, descriptorBip380: response?.payload?.descriptor }));
    } else {
        dispatch(onCancel());
        // Special case: closing no-backup warning modal should not show a toast.
        if (response.payload.code === 'Method_PermissionsNotGranted') return;
        dispatch(
            notificationsActions.addToast({
                type: 'verify-descriptor-error',
                error: response.payload.error,
            }),
        );
    }
};
