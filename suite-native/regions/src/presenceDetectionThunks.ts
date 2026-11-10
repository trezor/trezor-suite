import { getCalendars, getLocales } from 'expo-localization';

import { geolocationActions } from '@suite-common/geolocation';
import {
    PRESENCE_CHECK_INTERVAL_MS,
    type RefreshPresenceIpCountryThunkState,
    buildNativeDeviceSignals,
    refreshPresenceIpCountryThunk,
} from '@suite-common/regions';
import { PollingController } from '@suite-common/suite-utils';
import { createThunk } from '@trezor/redux-utils';

const presencePolling = new PollingController();

export const refreshDevicePresenceSignalsThunk = createThunk<void, void, void>(
    '@suite-native/regions/refreshDevicePresenceSignals',
    (_, { dispatch }) => {
        dispatch(
            geolocationActions.setDevicePresenceSignals(
                buildNativeDeviceSignals({
                    timeZone: getCalendars()[0]?.timeZone ?? null,
                    locales: getLocales(),
                }),
            ),
        );
    },
);

type RunPresenceDetectionThunkState = RefreshPresenceIpCountryThunkState;

export const runPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: RunPresenceDetectionThunkState }
>('@suite-native/regions/runPresenceDetection', async (_, { dispatch }) => {
    await Promise.all([
        dispatch(refreshDevicePresenceSignalsThunk()),
        dispatch(refreshPresenceIpCountryThunk()),
    ]);
});

export type InitPresenceDetectionThunkState = RunPresenceDetectionThunkState;

export const initPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: InitPresenceDetectionThunkState }
>('@suite-native/regions/initPresenceDetection', async (_, { dispatch }) => {
    const run = async () => {
        await dispatch(runPresenceDetectionThunk());
    };

    await presencePolling.restart(run, PRESENCE_CHECK_INTERVAL_MS);
});
