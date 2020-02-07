import TrezorConnect, { UI } from 'trezor-connect';
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
    // TODO: types in trezor-connect
    const buttonRequestHandler = (event: any) => {
        if (!event || event.code !== 'ButtonRequest_Address') return;
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
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
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
            path,
            address,
        });
    } else {
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
