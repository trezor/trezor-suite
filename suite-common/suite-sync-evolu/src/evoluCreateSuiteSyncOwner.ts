import {
    type CreateSuiteSyncOwner,
    CreateSuiteSyncOwnerError,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { err, ok } from '@trezor/type-utils';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';

export const evoluCreateSuiteSyncOwner: CreateSuiteSyncOwner = ({ data }) => {
    const appOwnerResult = createEvoluAppOwnerFromTrezorData({ data });

    if (!appOwnerResult.ok) {
        console.error('Evolu: appOwnerResult error', appOwnerResult);

        return err(
            CreateSuiteSyncOwnerError('Catastrophic failure, possible Evolu Breaking Change'),
        );
    }

    return ok({
        ownerId: asSuiteSyncOwnerId(appOwnerResult.value.id),
        ownerSecret: asSuiteSyncOwnerSecretHex(data),
    });
};
