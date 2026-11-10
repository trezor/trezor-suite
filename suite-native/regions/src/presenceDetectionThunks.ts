import { AppState } from 'react-native';

import { PRESENCE_CHECK_INTERVAL_MS } from '@suite-common/geolocation';
import {
    type RefreshPresenceIpCountryThunkState,
    refreshPresenceIpCountryThunk,
} from '@suite-common/regions';
import { PollingController } from '@suite-common/suite-utils';
import { createThunk } from '@trezor/redux-utils';

const presencePolling = new PollingController();
let isAppStateListenerAdded = false;

type RunPresenceDetectionThunkState = RefreshPresenceIpCountryThunkState;

export const runPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: RunPresenceDetectionThunkState }
>('@suite-native/regions/runPresenceDetection', async (_, { dispatch }) => {
    await dispatch(refreshPresenceIpCountryThunk({ isIpLookupAllowed: true }));
});

type InitPresenceDetectionThunkState = RunPresenceDetectionThunkState;

export const initPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: InitPresenceDetectionThunkState }
>('@suite-native/regions/initPresenceDetection', async (_, { dispatch }) => {
    const run = async () => {
        await dispatch(runPresenceDetectionThunk());
    };

    if (!isAppStateListenerAdded) {
        isAppStateListenerAdded = true;
        AppState.addEventListener('change', appState => {
            if (appState === 'active') void run();
        });
    }

    await presencePolling.restart(run, PRESENCE_CHECK_INTERVAL_MS);
});
