import { type EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { ok } from '@trezor/type-utils';

import { type LoadDelegatedIdentityKeyFromStateDep } from './loadDelegatedIdentityKeyFromState';
import { type RetrieveDelegatedIdentityKeyFromDeviceDep } from './retrieveDelegatedIdentityKeyFromDevice';
import { type SaveDelegatedIdentityKeyDep } from './saveDelegatedIdentityKey';

export type EnsureDelegatedIdentityKeyDeps = SaveDelegatedIdentityKeyDep &
    LoadDelegatedIdentityKeyFromStateDep &
    RetrieveDelegatedIdentityKeyFromDeviceDep;

export const createEnsureDelegatedIdentityKey =
    (deps: EnsureDelegatedIdentityKeyDeps): EnsureDelegatedIdentityKey =>
    async ({ device }) => {
        const currentDelegatedKey = await deps.loadDelegatedIdentityKeyFromState({
            deviceId: device.id,
        });

        if (currentDelegatedKey !== null) {
            return ok(currentDelegatedKey);
        }

        const result = await deps.retrieveDelegatedIdentityKeyFromDevice({
            device,
        });

        if (!result.success) {
            return result;
        }

        await deps.saveDelegatedIdentityKey({
            deviceId: device.id,
            delegatedIdentityKey: result.payload,
        });

        return ok(result.payload);
    };
