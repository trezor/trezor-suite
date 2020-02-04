import TrezorConnect, { UI } from 'trezor-connect';
import { RECEIVE } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { GetState, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';

export type ReceiveActions =
    | { type: typeof RECEIVE.INIT; descriptor: string }
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.SHOW_ADDRESS; descriptor: string }
    | { type: typeof RECEIVE.HIDE_ADDRESS; descriptor: string }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS; descriptor: string };

export const dispose = (): WalletAction => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (path: string): WalletAction => {
    return {
        type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
        descriptor: path,
    };
};

export const showAddress = (path: string) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const selectedDevice = getState().suite.device;
    const { account } = getState().wallet.selectedAccount;

    if (!selectedDevice || !account) return;
    if (!selectedDevice.connected || !selectedDevice.available) {
        // Show modal when device is not connected
        dispatch(
            modalActions.openModal({
                type: 'unverified-address',
                device: selectedDevice,
                addressPath: path,
            }),
        );
        return;
    }

    const params = {
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        path,
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
    };

    const buttonRequestHandler = () => {
        // mark address that is being verified
        dispatch({
            type: RECEIVE.INIT,
            descriptor: path,
        });
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
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
            descriptor: path,
        });
    } else {
        dispatch({
            type: RECEIVE.HIDE_ADDRESS,
            descriptor: path,
        });

        // special case: device no-backup permissions not granted
        if (response.payload.code === 403) return;

        dispatch(
            notificationActions.add({
                type: 'verify-address-error',
                error: response.payload.error,
            }),
        );
    }
};
