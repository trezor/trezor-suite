import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import { RECEIVE } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { GetState, Dispatch } from '@suite-types';

export type ReceiveActions =
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.SHOW_ADDRESS; path: string; address: string }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS; path: string; address: string };

export const dispose = (): ReceiveActions => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (path: string, address: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;
    dispatch(
        modalActions.openModal({
            type: 'address',
            device,
            address,
            addressPath: path,
            networkType: account.networkType,
            symbol: account.symbol,
            cancelable: true,
        }),
    );
    dispatch({
        type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
        path,
        address,
    });
};

export const showAddress = (path: string, address: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;

    const modalPayload = {
        device,
        address,
        addressPath: path,
        networkType: account.networkType,
        symbol: account.symbol,
    };

    // Show warning when device is not connected
    if (!device.connected || !device.available) {
        dispatch(
            modalActions.openModal({
                type: 'unverified-address',
                ...modalPayload,
            }),
        );
        return;
    }

    const params = {
        device,
        path,
        useEmptyPassphrase: device.useEmptyPassphrase,
    };

    // catch button request and open modal
    const buttonRequestHandler = (event: ButtonRequestMessage['payload']) => {
        if (!event || event.code !== 'ButtonRequest_Address') return;
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
                blockClosing: true,
            }),
        );
    };

    let fn;
    switch (account.networkType) {
        case 'ethereum':
            fn = TrezorConnect.ethereumGetAddress;
            break;
        case 'ripple':
            fn = TrezorConnect.rippleGetAddress;
            break;
        case 'bitcoin':
            fn = TrezorConnect.getAddress;
            break;
        default:
            fn = () => ({
                success: false,
                payload: { error: 'Method for getAddress not defined', code: undefined },
            });
            break;
    }

    TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);
    const response = await fn(params);
    TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

    if (response.success) {
        // show second part of the "confirm address" modal
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
                confirmed: true,
                cancelable: true,
            }),
        );
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
            path,
            address,
        });
    } else {
        // we are blocking close event in the modal reducer.
        // On failed action we need to close it manually
        const currentModal = getState().modal;
        if (
            currentModal.context === '@modal/context-user' &&
            currentModal.payload.type === 'address'
        ) {
            dispatch(modalActions.onCancel());
        }
        // special case: device no-backup permissions not granted
        if (response.payload.code === 'Method_PermissionsNotGranted') return;

        dispatch(
            notificationActions.addToast({
                type: 'verify-address-error',
                error: response.payload.error,
            }),
        );
    }
};
