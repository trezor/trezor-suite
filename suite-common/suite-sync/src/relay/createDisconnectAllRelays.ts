import {
    type DisconnectAllRelays,
    type GetAllDeviceSessionIdsDep,
    type SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';
import { isNotNull } from '@trezor/utils';

import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type DisconnectAllRelaysDeps = GetAllDeviceSessionIdsDep & SuiteSyncStorageRepositoryDep;

export const createDisconnectAllRelays =
    (deps: DisconnectAllRelaysDeps): DisconnectAllRelays =>
    async () => {
        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
            const storage = deps.suiteSyncStorageRepository.get(storageId);

            if (isNotNull(storage)) {
                await storage.disconnectRelay();
            }
        }
    };
