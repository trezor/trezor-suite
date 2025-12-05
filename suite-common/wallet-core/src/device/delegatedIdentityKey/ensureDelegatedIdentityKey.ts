import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
import { Result, ok } from '@trezor/type-utils';

import { DeviceCancelledErr, DeviceError } from '../deviceUtils';
import { LoadDelegatedIdentityKeyFromStateDep } from './loadDelegatedIdentityKeyFromState';
import {
    RetrieveDelegatedIdentityKeyFromDeviceDep,
    RetrieveDelegatedIdentityKeyParams,
} from './retrieveDelegatedIdentityKeyFromDevice';
import { SaveDelegatedIdentityKeyDep } from './saveDelegatedIdentityKey';

export type EnsureDelegatedIdentityKeyParams = {
    device: Pick<TrezorDeviceWithState, 'id'> & RetrieveDelegatedIdentityKeyParams['device'];
};

export type EnsureDelegatedIdentityKey = (
    params: EnsureDelegatedIdentityKeyParams,
) => Promise<Result<DelegatedIdentityKey, DeviceError | DeviceCancelledErr>>;

export type EnsureDelegatedIdentityKeyDeps = {
    getThpStaticKey: () => string | undefined;
} & SaveDelegatedIdentityKeyDep &
    LoadDelegatedIdentityKeyFromStateDep &
    RetrieveDelegatedIdentityKeyFromDeviceDep;

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

        const thpStaticHostKey = deps.getThpStaticKey();
        const result = await deps.retrieveDelegatedIdentityKeyFromDevice({
            device,
            thpStaticHostKey,
        });

        if (!result.ok) {
            return result;
        }

        await deps.saveDelegatedIdentityKey({
            deviceId: device.id,
            delegatedIdentityKey: result.value,
        });

        return ok(result.value);
    };
