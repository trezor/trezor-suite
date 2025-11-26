import { Dispatch } from '@reduxjs/toolkit';

import { ChangeRelayUrl, SuiteSyncStorageRepository } from '@suite-common/suite-sync-storage';
import { SuiteSyncOwner } from '@suite-common/suite-types';

import { setSuiteSyncRelayUrl } from '../suiteSyncActions';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relayUrl';

export type ChangeRelayUrlDeps = {
    getAllDevicesOwners: () => SuiteSyncOwner[];
    dispatch: Dispatch;
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
};

export const createChangeRelayUrl =
    (deps: ChangeRelayUrlDeps): ChangeRelayUrl =>
    async ({ relayUrl }) => {
        deps.dispatch(setSuiteSyncRelayUrl({ url: relayUrl }));

        // We save empty, but we need to reconnect to DEFAULT in case user clears relay form to empty
        const normalizedUrl =
            relayUrl === null || relayUrl.trim() === '' ? DEFAULT_SUITE_SYNC_RELAY_URL : relayUrl;

        const owners = deps.getAllDevicesOwners();

        for (const owner of owners) {
            await deps.suiteSyncStorageRepository.get(owner).updateRelayUrl(normalizedUrl);
        }
    };
