import { type Dispatch } from '@reduxjs/toolkit';

import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { setConnectionModal, setConnectionMode } from '@suite/device';
import { closeModal, preserveModal, removePreserveModal } from '@suite/modal';
import {
    type DeviceRootState,
    selectIsDevicePinLocked,
    selectSelectedDevice,
} from '@suite-common/device';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type WalletSettingsRootState,
    acquireDevice,
    confirmAddressOnDeviceThunk,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

type ShowAddressThunkDeps = { services: DesktopAnalyticsDep };

export const showAddressThunk =
    ({ path }: { path: string }) =>
    async (
        dispatch: Dispatch,
        getState: () => DeviceRootState &
            WalletSettingsRootState &
            SelectedAccountRootState &
            ReceiveRootState,
        extra: ShowAddressThunkDeps,
    ) => {
        const device = selectSelectedDevice(getState());
        const account = selectSelectedAccount(getState());

        if (!device || !account) return;

        const currentFreshAddress = selectCurrentFreshAddress(getState(), account.key);

        extra.services.analytics.report({
            type: events.receiveStartVerificationEvent.name,
            payload: { isFreshAddress: currentFreshAddress?.path === path },
        });

        // Verification cannot start without a device, so ask the user to connect one.
        if (!device.connected || !device.available) {
            if (device.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        // A PIN-locked device stays connected & available, so nothing stops the user from asking for
        // a verification it cannot answer. Unlock it first — acquireDevice reads features, which
        // makes the device prompt for the PIN. It emits device-change before it resolves, so the
        // status below is already up to date; still locked means the user dismissed the prompt, and
        // acquireDevice has reported any real failure itself.
        if (selectIsDevicePinLocked(getState())) {
            await dispatch(acquireDevice({ requestedDevice: device }));

            if (selectIsDevicePinLocked(getState())) return;
        }

        const addressDisplayType = selectAddressDisplayType(getState());
        const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;

        dispatch(preserveModal());

        extra.services.analytics.report({
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
            // Address verified on device — just close the confirm-on-device modal, don't show the
            // address modal afterwards.
            dispatch(closeModal());

            extra.services.analytics.report({
                type: events.createReceiveAddressConfirmOnTrezorEvent.name,
                payload: { assetSymbol: account.symbol },
            });
        } else {
            dispatch(closeModal());
            if (
                // Special case: device no-backup permissions not granted
                response.error.code === 'Method_PermissionsNotGranted' ||
                // User action: address cancelled on device
                response.error.code === 'Failure_ActionCancelled' ||
                // User action: receive modal closed, cancelling the request
                response.error.code === 'Method_Cancel' ||
                // User action: connect popup closed, interrupting the request
                response.error.code === 'Method_Interrupted'
            )
                return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.error.message,
                }),
            );
        }
    };
