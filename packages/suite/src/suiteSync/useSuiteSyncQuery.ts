import { use } from 'react';

import { Query, QueryRows, Row } from '@evolu/common/local-first';
import { Evolu } from '@evolu/common/local-first';

import { createStorageIdFromDeviceStaticSessionId } from '@suite-common/suite-sync';
import type { StaticSessionId } from '@trezor/connect';

import { useSuiteSyncQuerySubscription } from './useSuiteSyncQuerySubscription.js';
import { useSuiteServices } from '../support/SuiteServicesProvider';

export const useSuiteSyncQuery = <R extends Row>(
    deviceStaticSessionId: StaticSessionId | null,
    createQuery: (evolu: Evolu) => Query<R>,
    options: Partial<{
        /** Without subscribing to changes. */
        readonly once: boolean;

        /** Reuse existing promise instead of loading so query will not suspense. */
        readonly promise: Promise<QueryRows<R>>;
    }> = {},
): QueryRows<R> => {
    const { suiteSync } = useSuiteServices();

    const storage =
        deviceStaticSessionId !== null
            ? suiteSync.suiteSyncStorageRepository.get(
                  createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId),
              )
            : null;

    const evolu: Evolu = storage?.evolu;
    const query = createQuery(evolu);

    use(options.promise ?? evolu.loadQuery(query));

    return useSuiteSyncQuerySubscription(query, options, evolu);
};
