import { EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { ok } from '@trezor/type-utils';

import { LoadDelegatedIdentityKeyFromStateDep } from './loadDelegatedIdentityKeyFromState';
import { RetrieveDelegatedIdentityKeyFromDeviceDep } from './retrieveDelegatedIdentityKeyFromDevice';
import { SaveDelegatedIdentityKeyDep } from './saveDelegatedIdentityKey';

export type EnsureDelegatedIdentityKeyDeps = {
    getThpStaticKey: () => string | undefined;
} & SaveDelegatedIdentityKeyDep &
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
