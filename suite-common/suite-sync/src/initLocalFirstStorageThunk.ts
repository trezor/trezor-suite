import { EvoluDeps } from '@evolu/common'; // Todo: this dependency shall not be here

import { createThunk } from '@suite-common/redux-utils';
import { EvoluStorage } from '@suite-common/suite-sync-evolu';
import {
    LocalFirstStorageProvider,
    setLocalFirstStorageProvider,
} from '@suite-common/suite-sync-storage';
import { EvoluKeys } from '@suite-common/suite-types';

import { DEFAULT_SUITE_SYNC_RELAY_URL, LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import {
    selectIsLocalFirstStorageEnabled,
    selectLocalFirstStorageRelayUrl,
} from './suiteSyncSelectors';

export const initLocalFirstStorageThunk = createThunk<void, void, void>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/initLocalFirstStorageThunk`,
    (_, { dispatch, extra }) => {
        dispatch(extra.thunks.initLocalFirstStorage());
    },
);

const evoluStorageCreator =
    (evoluDeps: EvoluDeps) => (evoluKeys: EvoluKeys, relayUrl: string | null) =>
        // This is the place were we decide which storage we use
        new EvoluStorage({
            relayUrl:
                relayUrl === null || relayUrl.trim() === ''
                    ? DEFAULT_SUITE_SYNC_RELAY_URL
                    : relayUrl,
            evoluDeps,
            evoluKeys,
        });

export const initLocalFirstStorageThunkFactory = (evoluDeps: EvoluDeps) =>
    createThunk<void, void, void>(
        `${LOCAL_FIRST_STORAGE_PREFIX}/initLocalFirstStorageThunk`,
        (_, { getState }) => {
            const isLocalFirstStorageEnabled = selectIsLocalFirstStorageEnabled(getState());

            if (!isLocalFirstStorageEnabled) {
                return;
            }

            const relayUrl = selectLocalFirstStorageRelayUrl(getState());

            setLocalFirstStorageProvider(
                new LocalFirstStorageProvider(relayUrl, evoluStorageCreator(evoluDeps)),
            );
        },
    );
