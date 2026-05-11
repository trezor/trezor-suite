import { type Dispatch } from '@reduxjs/toolkit';

import {
    type ChangeRelayUrl,
    type SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

import { setSuiteSyncRelayUrl } from '../suiteSyncSlice';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relayUrl';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type ChangeRelayUrlDeps = {
    dispatch: Dispatch;
    getAllDeviceSessionIds: () => StaticSessionId[];
} & SuiteSyncStorageRepositoryDep;

export const createChangeRelayUrl =
    (deps: ChangeRelayUrlDeps): ChangeRelayUrl =>
    async ({ relayUrl }) => {
        deps.dispatch(setSuiteSyncRelayUrl({ url: relayUrl }));

        // We save empty, but we need to reconnect to DEFAULT in case user clears relay form to empty
        const normalizedUrl =
            relayUrl === null || relayUrl.trim() === '' ? DEFAULT_SUITE_SYNC_RELAY_URL : relayUrl;

        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
            const storage = deps.suiteSyncStorageRepository.get(storageId);

            if (isNotNull(storage)) {
                await storage.updateRelayUrl(normalizedUrl);
            }
        }
    };
