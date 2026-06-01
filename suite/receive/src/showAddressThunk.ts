import { type Dispatch } from '@reduxjs/toolkit';

import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { closeModal, openModal, preserveModal, removePreserveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type WalletSettingsRootState,
    confirmAddressOnDeviceThunk,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { openAddressModal } from './openAddressModal';

export const showAddressThunk =
    ({ path, address }: { path: string; address: string }) =>
    async (
        dispatch: Dispatch,
        getState: () => DeviceRootState & WalletSettingsRootState & SelectedAccountRootState,
        extra: ExtraDependencies,
    ) => {
        const device = selectSelectedDevice(getState());
        const account = selectSelectedAccount(getState());

        if (!device || !account) return;

        const modalPayload = {
            accountKey: account.key,
            value: address,
            addressPath: path,
        };

        const addressDisplayType = selectAddressDisplayType(getState());
        const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;

        // Show warning when device is not connected.
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

        // After confirming address on the modal, it does not have to be persistent anymore.
        dispatch(removePreserveModal());

        if (response.success) {
            // Show second part of the confirm address modal.
            dispatch(openAddressModal({ ...modalPayload, isConfirmed: true }));

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.createReceiveAddressConfirmOnTrezorEvent.name,
                payload: { assetSymbol: account.symbol },
            });
        } else {
            dispatch(closeModal());
            // Special case: device no-backup permissions not granted.
            if (response.error.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.error.message,
                }),
            );
        }
    };
