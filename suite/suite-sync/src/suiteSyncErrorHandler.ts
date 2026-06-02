import { type Dispatch } from '@reduxjs/toolkit';

import { messages } from '@suite/intl';
import { type SuiteSyncAsyncError } from '@suite-common/suite-sync';
import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { suiteSyncErrorTranslationKeyMap } from './suiteSyncErrorTranslationKeyMap';
import { updateShowEnableSuiteSyncModal } from './suiteSyncSlice';

type SuiteSyncErrorHandler = {
    error: SuiteSyncAsyncError | EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;
    dispatch: Dispatch;
    deviceStaticSessionId: StaticSessionId | null;
};

/**
 * This is central error handler for SuiteSync errors that are expected to be handled in the UI layer.
 */
export const suiteSyncErrorHandler = ({
    error,
    dispatch,
    deviceStaticSessionId,
}: SuiteSyncErrorHandler) => {
    const { type } = error;

    // Todo: This is a special case, where we are not able to determine the device.
    //       It unfortunately can happen, if we are not able to map OwnerId to the Device
    //       See: https://github.com/trezor/trezor-suite/issues/27049
    if (deviceStaticSessionId === null) {
        console.error('Unexpected SuiteSync error', error);

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: `SuiteSync error: ${type}`,
            }),
        );

        return;
    }

    switch (type) {
        case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
        case 'SuiteSyncUnavailableOnDeviceError':
            dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

            return;

        case 'WriteModeRequiredForAllocation':
            // Do nothing, this is expected control flow error when we want allocate on-demand.
            return;

        // Those are very unexpected errors. We want to notify user
        // about them (Suite Sync is probably not working), but we
        // don't have any specific handling for them.
        case 'ProofOfDelegatedSignFailed':
        case 'RelayOther':
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `SuiteSync error: ${type}`,
                }),
            );

            return;

        case 'DeviceNotConnectedError':
            // A disconnected device is an expected condition - Suite Sync stays enabled
            // and will retry once the device reconnects, so we stay silent.
            return;

        case 'DeviceCancelled':
        case 'DeviceError':
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: messages[suiteSyncErrorTranslationKeyMap[type]].defaultMessage,
                }),
            );

            return;

        // We want those errors to come to Sentry
        case 'SuiteSyncUpdateError':
        case 'QuotaManagerCommunicationFailed':
            console.error('Unexpected SuiteSync error', error);

            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: messages[suiteSyncErrorTranslationKeyMap[type]].defaultMessage,
                }),
            );

            return;

        default:
            return exhaustive(type);
    }
};
