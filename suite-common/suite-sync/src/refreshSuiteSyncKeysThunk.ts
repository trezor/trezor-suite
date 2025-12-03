import { Dispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    deviceActions,
    ensureDelegatedIdentityKeyThunk,
    selectDevices,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import { createEnsureSuiteSyncOwnerKeys } from './device/ensureSuiteSyncOwnerKeys';

type RefreshSuiteSyncKeysThunkParams = {
    device: TrezorDevice;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const refreshSuiteSyncKeysThunk =
    ({ device: originalDevice }: RefreshSuiteSyncKeysThunkParams) =>
    async (dispatch: Dispatch, getState: () => any, { services }: ExtraDependencies) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device) ||
            device.suiteSyncOwner !== undefined
        ) {
            return ok(); // No action needed
        }

        const delegatedKeyResult = await dispatch(ensureDelegatedIdentityKeyThunk({ device }));

        if (!delegatedKeyResult.ok) {
            return delegatedKeyResult;
        }

        const evoluNodeResult = await createEnsureSuiteSyncOwnerKeys({
            trezorConnect: TrezorConnect,
            createSuiteSyncOwner: services.suiteSync.createSuiteSyncOwner,
        })({
            device,
            delegatedKey: delegatedKeyResult.value,
        });

        if (!evoluNodeResult.ok) {
            dispatch(deviceActions.setSuiteSyncOwner({ device, owner: undefined }));
            dispatch(
                deviceActions.setDelegatedIdentityKey({ deviceId: device.id, delegatedKey: null }),
            );

            return evoluNodeResult;
        }

        dispatch(
            deviceActions.setSuiteSyncOwner({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
