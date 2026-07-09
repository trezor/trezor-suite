import {
    type GetAllDeviceSessionIdsDep,
    type ReconnectAllRelays,
    type SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';
import { isNotNull } from '@trezor/utils';

import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';
import { type WithSuiteSyncState } from '../suiteSyncSlice';
import { selectSuiteSyncRelayUrl } from './relayUrl';

export type ReconnectAllRelaysDeps = {
    getState: () => WithSuiteSyncState;
} & GetAllDeviceSessionIdsDep &
    SuiteSyncStorageRepositoryDep;

export const createReconnectAllRelays =
    (deps: ReconnectAllRelaysDeps): ReconnectAllRelays =>
    async ({ isTorEnabled }) => {
        const relayUrl = selectSuiteSyncRelayUrl(deps.getState(), isTorEnabled);
        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
            const storage = deps.suiteSyncStorageRepository.get(storageId);

            if (isNotNull(storage)) {
                await storage.updateRelayUrl(relayUrl);
            }
        }
    };
