import { Dispatch } from '@reduxjs/toolkit';

import { SubscribeSuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { isSuiteSyncSupportedByDevice } from '../device';
import { SubscribeLabeling } from '../labeling/createSubscribeLabeling';
import { RefreshSuiteSyncKeys } from '../refreshSuiteSyncKeys';

type CreateSubscribeSuiteSyncDeps = {
    dispatch: Dispatch;
    getState: () => any;
    subscribeLabeling: SubscribeLabeling;
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const createSubscribeSuiteSyncStorage =
    (deps: CreateSubscribeSuiteSyncDeps): SubscribeSuiteSyncStorage =>
    async ({ device }) => {
        if (!isSuiteSyncSupportedByDevice(device)) {
            return;
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        if (device.suiteSyncOwner === undefined) {
            const result = await deps.refreshSuiteSyncKeys({ device });

            if (!result.ok) {
                const errType = result.error.type;

                switch (errType) {
                    case 'DeviceDoesNotSupportSuiteSyncErr':
                        // This may happen for multiple reasons (disconnected device, ...)
                        return;

                    case 'DeviceError':
                    case 'DeviceCancelled':
                        deps.dispatch(
                            notificationsActions.addToast({ type: 'suite-sync-keys-error' }),
                        );

                        return;
                    case 'CreateSuiteSyncOwnerError':
                    case 'EncryptionUnavailable':
                    case 'ProofOfDelegatedSignFailed':
                        console.error(result.error);
                        // Todo: dispatch better notification
                        deps.dispatch(
                            notificationsActions.addToast({ type: 'suite-sync-keys-error' }),
                        );

                        return;
                    default:
                        return exhaustive(errType);
                }
            }
        }

        // Reselect the device to get the correct secret (cipherKey)
        const reselectedDevice = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = reselectedDevice?.suiteSyncOwner;

        if (owner === undefined) {
            console.error('Evolu: Keys set to reselectedDevice', reselectedDevice?.suiteSyncOwner);

            return;
        }

        deps.subscribeLabeling({ owner, walletDescriptor });

        return;
    };
