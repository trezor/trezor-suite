import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { closeModal, openModal, preserveModal, removePreserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { RECEIVE } from 'src/actions/wallet/constants';
import { selectAddressDisplayType } from 'src/selectors/suite/suiteSelectors';
import { type Dispatch, type GetState } from 'src/types/suite';

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
            openModal({
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
    (path: string, address: string) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
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
                openModal({
                    type: 'unverified-address',
                    ...modalPayload,
                }),
            );

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.createReceiveAddressShowAddressEvent.name,
                payload: {
                    assetSymbol: account.symbol,
                    type: 'unverified',
                },
            });

            return;
        }

        dispatch(preserveModal());

        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.createReceiveAddressShowAddressEvent.name,
            payload: {
                assetSymbol: account.symbol,
                type: 'verified',
            },
        });

        const response = await dispatch(
            confirmAddressOnDeviceThunk({ accountKey: account.key, addressPath: path, chunkify }),
        ).unwrap();

        // After confirming address on the modal, it does not have to be persistent anymore
        dispatch(removePreserveModal());

        if (response.success) {
            // show second part of the "confirm address" modal
            dispatch(openAddressModal({ ...modalPayload, isConfirmed: true }));

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.createReceiveAddressConfirmOnTrezorEvent.name,
                payload: { assetSymbol: account.symbol },
            });
        } else {
            dispatch(closeModal());
            // special case: device no-backup permissions not granted
            if (response.error.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.error.message,
                }),
            );
        }
    };
