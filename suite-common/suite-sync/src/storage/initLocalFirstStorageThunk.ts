import { EvoluDeps } from '@evolu/common';

import { createThunk } from '@suite-common/redux-utils';

import { LocalFirstStorageProvider } from './LocalFirstStorageProvider';
import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { setLocalFirstStorageProvider } from './sharedObjects';
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

export const initLocalFirstStorageThunkFactory = (evoluDeps: EvoluDeps) =>
    createThunk<void, void, void>(
        `${LOCAL_FIRST_STORAGE_PREFIX}/initLocalFirstStorageThunk`,
        (_, { getState }) => {
            const isLocalFirstStorageEnabled = selectIsLocalFirstStorageEnabled(getState());

            if (!isLocalFirstStorageEnabled) {
                return;
            }

            const relayUrl = selectLocalFirstStorageRelayUrl(getState());

            setLocalFirstStorageProvider(new LocalFirstStorageProvider(relayUrl, evoluDeps));
        },
    );
