import { type Evolu } from '@evolu/common';

import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type SuiteSyncErrorHandler } from '@suite-common/suite-sync-types';

export const createEvoluErrorHandler =
    (evolu: Evolu<any>, errorHandler: SuiteSyncErrorHandler) => () => {
        const error = evolu.getError();

        // early return if there is no error to handle
        if (error === null) {
            return;
        }

        switch (error.type) {
            case 'ProtocolQuotaError':
                errorHandler({
                    type: 'RelayQuotaExceeded',
                    ownerId: asSuiteSyncOwnerId(error.ownerId),
                });

                return;

            default:
                errorHandler({ type: 'RelayOther', message: JSON.stringify(error) });

                return;
        }
    };
