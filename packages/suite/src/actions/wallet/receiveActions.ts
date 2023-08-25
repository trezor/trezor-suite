import { RECEIVE } from 'src/actions/wallet/constants';
import * as modalActions from 'src/actions/suite/modalActions';
import { GetState, Dispatch } from 'src/types/suite';
import {
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getAddressType,
} from 'src/utils/wallet/cardanoUtils';

import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { getDerivationType } from '@suite-common/wallet-utils';

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
                value: address,
                addressPath: path,
                networkType: account.networkType,
                symbol: account.symbol,
                isCancelable: true,
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
            value: address,
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

        let response;
        const params = {
            device,
            path,
            unlockPath: account.unlockPath,
            useEmptyPassphrase: device.useEmptyPassphrase,
            coin: account.symbol,
        };

        dispatch(modalActions.preserve());

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
            case 'solana':
                response = await TrezorConnect.solanaGetAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                };
                break;
        }

        if (response.success) {
            // show second part of the "confirm address" modal
            dispatch(
                modalActions.openModal({
                    type: 'address',
                    ...modalPayload,
                    isConfirmed: true,
                    isCancelable: true,
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
