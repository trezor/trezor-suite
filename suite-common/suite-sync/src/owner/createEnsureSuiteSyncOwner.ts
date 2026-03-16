import { type EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { type LoadSuiteSyncOwnerFromStateDep } from './createLoadSuiteSyncOwnerFromState';
import { type RetrieveSuiteSyncOwnerKeysDep } from './createRetrieveSuiteSyncOwner';
import { type SaveSuiteSyncOwnerDep } from './createSaveSuiteSyncOwner';

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

        if (!result.success) {
            return result;
        }

        await deps.saveSuiteSyncOwner({
            deviceStaticId: device.state.staticSessionId,
            suiteSyncOwner: result.payload,
        });

        return ok(result.payload);
    };
