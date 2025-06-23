import { EvoluDeps } from '@evolu/common';

import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { LocalFirstStorageProvider } from './LocalFirstStorageProvider';
import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { setLocalFirstStorageProvider } from './sharedObjects';
import { subscribeLocalFirstStorageThunk } from './subscribeLocalFirstStorageThunk';

export const initLocalFirstStorageThunkFactory = (evoluDeps: EvoluDeps) =>
    createThunk<void, void, void>(
        `${LOCAL_FIRST_STORAGE_PREFIX}/initLocalFirstStorageThunk`,
        (_, { getState, dispatch, extra }) => {
            const { isLocalFirstStorageEnabled } = extra.selectors.selectSuiteSettings(getState());

            if (!isLocalFirstStorageEnabled) {
                return;
            }

            const relayUrl =
                extra.selectors.selectSuiteSettings(getState()).localFirstStorageRelayUrl;

            if (relayUrl === null) {
                return;
            }

            setLocalFirstStorageProvider(new LocalFirstStorageProvider(relayUrl, evoluDeps));

            const devices = selectDevices(getState());

            console.log('____devices', devices);
            for (const device of devices) {
                dispatch(subscribeLocalFirstStorageThunk({ device }));
            }
        },
    );
