import TrezorConnect, { UI, UiRequestButton } from '@trezor/connect';
import { RECEIVE } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { GetState, Dispatch } from '@suite-types';
import {
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getAddressType,
    getDerivationType,
} from '@wallet-utils/cardanoUtils';

export type ReceiveAction =
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.SHOW_ADDRESS; path: string; address: string }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS; path: string; address: string };

export const dispose = (): ReceiveAction => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress =
    (path: string, address: string) => (dispatch: Dispatch, getState: GetState) => {
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

export const showAddress =
    (path: string, address: string) => async (dispatch: Dispatch, getState: GetState) => {
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

        // catch button request and open modal
        const buttonRequestHandler = (event: UiRequestButton['payload']) => {
            if (!event || event.code !== 'ButtonRequest_Address') return;
            // Receive modal has 2 steps, 1. step: we are waiting till an user confirms the address on a device
            // 2. step: we show the copy button and hide confirm-on-device bubble.
            // The problem is that after user confirms the address device sent UI.CLOSE_UI.WINDOW that triggers closing the modal.
            // By setting a device's processMode to 'confirm-addr' we are blocking the action UI.CLOSE_UI.WINDOW (handled in actionBlockerMiddleware)
            // processMode is set back to undefined at the end of the receive modal flow
            dispatch(modalActions.preserve());
            dispatch(
                modalActions.openModal({
                    type: 'address',
                    ...modalPayload,
                    confirmed: false,
                }),
            );
        };

        let response;
        const params = {
            device,
            path,
            unlockPath: account.unlockPath,
            useEmptyPassphrase: device.useEmptyPassphrase,
            coin: account.symbol,
        };

        TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);

        switch (account.networkType) {
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = await TrezorConnect.cardanoGetAddress({
                    device,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    addressParameters: {
                        stakingPath: getStakingPath(account),
                        addressType: getAddressType(account.accountType),
                        path,
                    },
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(account.symbol),
                    derivationType: getDerivationType(account.accountType),
                });
                break;
            case 'ripple':
                response = await TrezorConnect.rippleGetAddress(params);
                break;
            case 'bitcoin':
                response = await TrezorConnect.getAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                };
                break;
        }

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
            dispatch(modalActions.onCancel());
            // special case: device no-backup permissions not granted
            if (response.payload.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.payload.error,
                }),
            );
        }
    };
