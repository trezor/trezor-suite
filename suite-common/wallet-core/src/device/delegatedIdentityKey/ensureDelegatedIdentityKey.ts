import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import { Result, ok } from '@trezor/type-utils';

import { DeviceCancelledErr, DeviceError } from '../deviceUtils';
import { LoadDelegatedIdentityKeyFromStateDep } from './loadDelegatedIdentityKeyFromState';
import { retrieveDelegatedIdentityKeyFromDevice } from './retrieveDelegatedIdentityKeyFromDevice';
import { SaveDelegatedIdentityKeyDep } from './saveDelegatedIdentityKey';

type EnsureDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
};

export type EnsureDelegatedIdentityKey = (
    params: EnsureDelegatedIdentityKeyParams,
) => Promise<Result<DelegatedIdentityKey, DeviceError | DeviceCancelledErr>>;

type EnsureDelegatedIdentityKeyDeps = { getState: () => any } & SaveDelegatedIdentityKeyDep &
    LoadDelegatedIdentityKeyFromStateDep;

export type EnsureDelegatedIdentityKeyDep = {
    ensureDelegatedIdentityKey: EnsureDelegatedIdentityKey;
};

export const createEnsureDelegatedIdentityKey =
    (deps: EnsureDelegatedIdentityKeyDeps): EnsureDelegatedIdentityKey =>
    async ({ device }) => {
        const currentDelegatedKey = await deps.loadDelegatedIdentityKeyFromState({
            deviceId: device.id,
        });

        if (currentDelegatedKey !== null) {
            return ok(currentDelegatedKey);
        }

        const thpStaticHostKey = selectThp(deps.getState()).staticKey;
        const result = await retrieveDelegatedIdentityKeyFromDevice({ device, thpStaticHostKey });

        if (!result.ok) {
            return result;
        }

        await deps.saveDelegatedIdentityKey({
            deviceId: device.id,
            delegatedIdentityKey: result.value,
        });

        return ok(result.value);
    };
