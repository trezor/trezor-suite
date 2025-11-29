import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive, ok } from '@trezor/type-utils';

import { isSuiteSyncSupportedByDevice } from './device';
import { subscribeLabelingUpdatesThunk } from './labeling/subscribeLabelingUpdatesThunk';
import { refreshSuiteSyncKeysThunk } from './refreshSuiteSyncKeysThunk';

type subscribeSuiteSyncStorageThunkParams = {
    device: TrezorDeviceWithState;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const subscribeSuiteSyncStorageThunk =
    ({ device }: subscribeSuiteSyncStorageThunkParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        if (!isSuiteSyncSupportedByDevice(device)) {
            return ok();
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        if (device.suiteSyncOwner === undefined) {
            const result = await dispatch(refreshSuiteSyncKeysThunk({ device }));

            if (!result.ok) {
                const errType = result.error.type;

                switch (errType) {
                    case 'DeviceError':
                    case 'DeviceCancelled':
                        dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));

                        return ok();
                    case 'CreateSuiteSyncOwnerError':
                    case 'EncryptionUnavailable':
                    case 'ProofOfDelegatedSingFailed':
                        console.error(result.error);
                        // Todo: dispatch better notification
                        dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));

                        return ok();
                    default:
                        return exhaustive(errType);
                }
            }
        }

        // Reselect the device to get the correct secret (cipherKey)
        const reselectedDevice = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = reselectedDevice?.suiteSyncOwner;

        if (owner === undefined) {
            console.error('Evolu: Keys set to reselectedDevice', reselectedDevice?.suiteSyncOwner);

            return ok();
        }

        dispatch(subscribeLabelingUpdatesThunk({ owner, walletDescriptor }));

        return ok();
    };
