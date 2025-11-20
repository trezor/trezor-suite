import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { retrieveDelegatedIdentityKeyThunk, selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { exhaustive, ok } from '@trezor/type-utils';

import { refreshSuiteSyncKeysThunk, retrieveEvoluNode } from './refreshSuiteSyncKeysThunk';
import { isSuiteSyncSupportedByDevice } from '../device';
import { subscribeLabelingUpdatesThunk } from '../labeling/subscribeLabelingUpdatesThunk';

type SubscribeLocalFirstStorageThunkParams = {
    device: TrezorDeviceWithState;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const subscribeLocalFirstStorageThunk =
    ({ device }: SubscribeLocalFirstStorageThunkParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        if (!isSuiteSyncSupportedByDevice(device)) {
            return ok();
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        if (device.localFirstStorageSecret?.evoluKeys === undefined) {
            // Todo: this Dependency Resolution will be pushed gradually up and up,
            //       until it reaches the top-level of the app, where all dependencies
            //       will be composed.
            const result = await refreshSuiteSyncKeysThunk({
                dispatch,
                getState,
                retrieveEvoluNode: retrieveEvoluNode({ connect: TrezorConnect }),
                retrieveDelegatedIdentityKeyThunk: retrieveDelegatedIdentityKeyThunk({
                    dispatch,
                    getState,
                    connect: TrezorConnect,
                }),
            })({ device });

            if (!result.ok) {
                const errType = result.error.type;

                switch (errType) {
                    case 'DeviceError':
                    case 'DeviceCancelled':
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

        const evoluKeys = reselectedDevice?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            console.error(
                'Evolu: Keys set to reselectedDevice',
                reselectedDevice?.localFirstStorageSecret,
            );

            return ok();
        }

        dispatch(subscribeLabelingUpdatesThunk({ evoluKeys, walletDescriptor }));

        return ok();
    };
