import { EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { LoadSuiteSyncOwnerFromStateDep } from './createLoadSuiteSyncOwnerFromState';
import { RetrieveSuiteSyncOwnerKeysDep } from './createRetrieveSuiteSyncOwner';
import { SaveSuiteSyncOwnerDep } from './createSaveSuiteSyncOwner';

export type CreateEnsureSuiteSyncOwnerDeps = RetrieveSuiteSyncOwnerKeysDep &
    LoadSuiteSyncOwnerFromStateDep &
    SaveSuiteSyncOwnerDep;

export const createEnsureSuiteSyncOwner =
    (deps: CreateEnsureSuiteSyncOwnerDeps): EnsureSuiteSyncOwner =>
    async ({ device, delegatedKey }) => {
        const currentSuiteSyncOwner = await deps.loadSuiteSyncOwnerFromState({
            deviceStaticId: device.state.staticSessionId,
        });

        if (currentSuiteSyncOwner !== null) {
            return ok(currentSuiteSyncOwner);
        }

        const result = await deps.retrieveSuiteSyncOwner({
            device,
            delegatedKey,
        });

        if (!result.ok) {
            return result;
        }

        await deps.saveSuiteSyncOwner({
            deviceStaticId: device.state.staticSessionId,
            suiteSyncOwner: result.value,
        });

        return ok(result.value);
    };
