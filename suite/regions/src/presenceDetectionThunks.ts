import { type TorRootState, selectIsTorDisabled } from '@suite/tor';
import { PRESENCE_CHECK_INTERVAL_MS } from '@suite-common/geolocation';
import {
    type RefreshPresenceIpCountryThunkState,
    refreshPresenceIpCountryThunk,
} from '@suite-common/regions';
import { PollingController } from '@suite-common/suite-utils';
import { createThunk } from '@trezor/redux-utils';

const presencePolling = new PollingController();
let isVisibilityListenerAdded = false;

export type RunPresenceDetectionThunkState = RefreshPresenceIpCountryThunkState & TorRootState;

export const runPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: RunPresenceDetectionThunkState }
>('@suite/regions/runPresenceDetection', async (_, { dispatch, getState }) => {
    await dispatch(
        refreshPresenceIpCountryThunk({ isIpLookupAllowed: selectIsTorDisabled(getState()) }),
    );
});

export type InitPresenceDetectionThunkState = RunPresenceDetectionThunkState;

export const initPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: InitPresenceDetectionThunkState }
>('@suite/regions/initPresenceDetection', async (_, { dispatch }) => {
    const run = async () => {
        await dispatch(runPresenceDetectionThunk());
    };

    if (!isVisibilityListenerAdded && typeof document !== 'undefined') {
        isVisibilityListenerAdded = true;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void run();
        });
    }

    await presencePolling.restart(run, PRESENCE_CHECK_INTERVAL_MS);
});
