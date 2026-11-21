import {
    PRESENCE_CHECK_INTERVAL_MS,
    type RefreshPresenceIpCountryThunkState,
    refreshPresenceIpCountryThunk,
} from '@suite-common/regions';
import { PollingController } from '@suite-common/suite-utils';
import { createThunk } from '@trezor/redux-utils';

const presencePolling = new PollingController();

type RunPresenceDetectionThunkState = RefreshPresenceIpCountryThunkState;

export const runPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: RunPresenceDetectionThunkState }
>('@suite-native/regions/runPresenceDetection', async (_, { dispatch }) => {
    await dispatch(refreshPresenceIpCountryThunk());
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
