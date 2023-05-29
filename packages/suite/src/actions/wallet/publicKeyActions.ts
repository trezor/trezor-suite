import * as modalActions from '@suite-actions/modalActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { GetState, Dispatch } from '@suite-types';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';

export const openXpubModal =
    (
        params?: Pick<
            Extract<modalActions.UserContextPayload, { type: 'xpub' }>,
            'isCancelable' | 'isConfirmed'
        >,
    ) =>
    (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        const { account } = getState().wallet.selectedAccount;

        if (!device || !account) return;

        dispatch(
            modalActions.openModal({
                type: 'xpub',
                device,
                value: account.descriptor,
                accountIndex: account.index,
                symbol: account.symbol,
                accountLabel: account.metadata.accountLabel,
                ...params,
            }),
        );
    };

export const showXpub = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;

    if (!device || !account) return;

    // Show warning when device is not connected.
    if (!device.connected || !device.available) {
        dispatch(
            modalActions.openModal({
                type: 'unverified-xpub',
            }),
        );
        return;
    }

    // Prevent flickering screen when modal changes.
    dispatch(modalActions.preserve());

    const params = {
        device,
        path: account.path,
        useEmptyPassphrase: device.useEmptyPassphrase,
        showOnTrezor: true,
    };
    let response: Success<unknown> | Unsuccessful;

    switch (account.networkType) {
        case 'bitcoin':
            response = await TrezorConnect.getPublicKey(params);
            break;
        case 'cardano':
            response = await TrezorConnect.cardanoGetPublicKey(params);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getPublicKey not defined', code: undefined },
            };
    }

    if (response.success) {
        // Show second part of the "confirm XPUB" modal.
        dispatch(openXpubModal({ isCancelable: true, isConfirmed: true }));
    } else {
        dispatch(modalActions.onCancel());
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
