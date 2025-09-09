import { EvoluDeps } from '@evolu/common';

import { createThunk } from '@suite-common/redux-utils';

import { LocalFirstStorageProvider } from './LocalFirstStorageProvider';
import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { setLocalFirstStorageProvider } from './sharedObjects';

export const initLocalFirstStorageThunkFactory = (evoluDeps: EvoluDeps) =>
    createThunk<void, void, void>(
        `${LOCAL_FIRST_STORAGE_PREFIX}/initLocalFirstStorageThunk`,
        (_, { getState, extra }) => {
            const { isLocalFirstStorageEnabled } = extra.selectors.selectSuiteSettings(getState());

            if (!isLocalFirstStorageEnabled) {
                return;
            }

            const relayUrl =
                extra.selectors.selectSuiteSettings(getState()).localFirstStorageRelayUrl;

            setLocalFirstStorageProvider(new LocalFirstStorageProvider(relayUrl, evoluDeps));
        },
    );
