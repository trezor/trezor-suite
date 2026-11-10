import { geolocationActions, geolocationInitialState } from '@suite-common/geolocation';
import { PRESENCE_CHECK_INTERVAL_MS } from '@suite-common/regions';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import type * as PresenceDetectionThunks from './presenceDetectionThunks';

const mockRefresh = jest.fn();
const mockRefreshResult = jest.fn<Promise<void>, []>(() => Promise.resolve());

jest.mock('expo-localization', () => ({
    getCalendars: () => [{ timeZone: 'Australia/Sydney' }],
    getLocales: () => [{ regionCode: 'AU' }],
}));

jest.mock('@suite-common/regions', () => ({
    ...jest.requireActual('@suite-common/regions'),
    refreshPresenceIpCountryThunk: () => {
        mockRefresh();

        return () => mockRefreshResult();
    },
}));

const state: PresenceDetectionThunks.InitPresenceDetectionThunkState = {
    geolocation: geolocationInitialState,
};
const getState = () => state;

const getDeviceSignalsActions = (actions: unknown[]) =>
    actions.filter(action => geolocationActions.setDevicePresenceSignals.match(action as never));

const loadThunks = async () => {
    let thunks: typeof PresenceDetectionThunks | undefined;

    await jest.isolateModulesAsync(async () => {
        thunks = await import('./presenceDetectionThunks');
    });

    if (!thunks) {
        throw new Error('presenceDetectionThunks failed to load');
    }

    return thunks;
};

describe('presenceDetectionThunks', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockRefresh.mockClear();
        mockRefreshResult.mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('initPresenceDetectionThunk runs immediately and then on every check interval', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch } = createMockDispatch({ getState });

        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('stores the device time zone and locale regions', async () => {
        const { refreshDevicePresenceSignalsThunk } = await loadThunks();
        const { actions, dispatch } = createMockDispatch({ getState });

        await refreshDevicePresenceSignalsThunk()(dispatch, getState, {});

        expect(getDeviceSignalsActions(actions)).toEqual([
            geolocationActions.setDevicePresenceSignals({
                timeZone: 'Australia/Sydney',
                primaryRegion: 'AU',
                secondaryRegions: [],
            }),
        ]);
    });

    it('stores device signals while the IP fetch is still pending', async () => {
        mockRefreshResult.mockImplementation(() => new Promise(() => {}));
        const { runPresenceDetectionThunk } = await loadThunks();
        const { actions, dispatch } = createMockDispatch({ getState });

        void runPresenceDetectionThunk()(dispatch, getState, {});
        await jest.advanceTimersByTimeAsync(0);

        expect(getDeviceSignalsActions(actions)).toHaveLength(1);
    });
});
