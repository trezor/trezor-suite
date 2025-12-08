import {
    RefreshSuiteKeysUnavailable,
    RefreshSuiteSyncKeys,
    RefreshSuiteSyncKeysDeps,
} from '@suite-common/suite-sync-types';
import { deviceActions, selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err, ok } from '@trezor/type-utils';

export const createRefreshSuiteSyncKeys =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device: originalDevice }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (device?.suiteSyncOwner !== undefined) {
            return ok();
        }

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device)
        ) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({ device });

        if (!delegatedKeyResult.ok) {
            return delegatedKeyResult;
        }

        const evoluNodeResult = await deps.ensureSuiteSyncOwnerKeys({
            device,
            delegatedKey: delegatedKeyResult.value,
        });

        if (!evoluNodeResult.ok) {
            deps.dispatch(deviceActions.setSuiteSyncOwner({ device, owner: undefined }));
            deps.dispatch(
                deviceActions.setDelegatedIdentityKey({ deviceId: device.id, delegatedKey: null }),
            );

            return evoluNodeResult;
        }

        deps.dispatch(
            deviceActions.setSuiteSyncOwner({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
