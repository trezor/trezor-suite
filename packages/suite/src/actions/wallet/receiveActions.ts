import { UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { confirmAddressOnDeviceThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as modalActions from 'src/actions/suite/modalActions';
import { RECEIVE } from 'src/actions/wallet/constants';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { Dispatch, GetState } from 'src/types/suite';

export type ReceiveAction =
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.SHOW_ADDRESS; path: string; address: string }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS; path: string; address: string };

export const dispose = (): ReceiveAction => ({
    type: RECEIVE.DISPOSE,
});

export const openAddressModal =
    (
        params: Pick<
            Extract<UserContextPayload, { type: 'address' }>,
            'addressPath' | 'value' | 'isConfirmed'
        >,
    ) =>
    (dispatch: Dispatch) => {
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...params,
            }),
        );
        dispatch({
            type: params.isConfirmed ? RECEIVE.SHOW_ADDRESS : RECEIVE.SHOW_UNVERIFIED_ADDRESS,
            path: params.addressPath,
            address: params.value,
        });
    };

export const showAddress =
    (path: string, address: string) => async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        const { account } = getState().wallet.selectedAccount;

        if (!device || !account) return;

        const modalPayload = {
            value: address,
            addressPath: path,
        };

        const addressDisplayType = selectAddressDisplayType(getState());
        const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;

        // Show warning when device is not connected
        if (!device.connected || !device.available) {
            dispatch(
                modalActions.openModal({
                    type: 'unverified-address',
                    ...modalPayload,
                }),
            );

            analytics.report({
                type: EventType.CreateReceiveAddressShowAddress,
                payload: {
                    assetSymbol: account.symbol,
                    type: 'unverified',
                },
            });

            return;
        }

        dispatch(modalActions.preserve());

        analytics.report({
            type: EventType.CreateReceiveAddressShowAddress,
            payload: {
                assetSymbol: account.symbol,
                type: 'verified',
            },
        });

        const response = await dispatch(
            confirmAddressOnDeviceThunk({ accountKey: account.key, addressPath: path, chunkify }),
        ).unwrap();

        if (response.success) {
            // show second part of the "confirm address" modal
            dispatch(openAddressModal({ ...modalPayload, isConfirmed: true }));

            analytics.report({
                type: EventType.CreateReceiveAddressConfirmOnTrezor,
                payload: { assetSymbol: account.symbol },
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
