import { type Dispatch } from '@reduxjs/toolkit';

import {
    type ChangeRelayUrl,
    type SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';

import { type SuiteSyncServer, setSuiteSyncServer } from '../suiteSyncSlice';
import { isUsingTrezorSuiteSyncServer } from './isUsingTrezorSuiteSyncServer';
import { DEFAULT_SUITE_SYNC_SERVER_URL } from './serverUrl';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type ChangeRelayUrlDeps = {
    dispatch: Dispatch;
    getAllDeviceSessionIds: () => StaticSessionId[];
} & SuiteSyncStorageRepositoryDep;

const deriveServer = (relayUrl: string | null): SuiteSyncServer => {
    if (relayUrl === null || relayUrl.trim() === '' || isUsingTrezorSuiteSyncServer(relayUrl)) {
        return { type: 'default', customUrl: null };
    }

    return { type: 'custom', customUrl: relayUrl };
};

export const createChangeServerUrl =
    (deps: ChangeRelayUrlDeps): ChangeRelayUrl =>
    async ({ relayUrl }) => {
        const server = deriveServer(relayUrl);
        deps.dispatch(setSuiteSyncServer(server));

        // We need to reconnect to DEFAULT in case user clears server form to empty
        const normalizedUrl =
            server.type === 'default' ? DEFAULT_SUITE_SYNC_SERVER_URL : server.customUrl!;

        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
            const storage = deps.suiteSyncStorageRepository.get(storageId);

            if (storage !== null) {
                await storage.updateRelayUrl(normalizedUrl);
            }
        }
    };
