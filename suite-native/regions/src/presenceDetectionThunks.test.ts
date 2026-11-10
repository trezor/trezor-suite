import { AppState, type AppStateStatus } from 'react-native';

import { PRESENCE_CHECK_INTERVAL_MS, geolocationInitialState } from '@suite-common/geolocation';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type RefreshPresenceIpCountryThunkState } from '@suite-common/regions';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import type * as PresenceDetectionThunks from './presenceDetectionThunks';

const mockRefresh = jest.fn();

jest.mock('@suite-common/regions', () => ({
    ...jest.requireActual('@suite-common/regions'),
    refreshPresenceIpCountryThunk: (params: unknown) => {
        mockRefresh(params);

        return () => Promise.resolve();
    },
}));

const state: RefreshPresenceIpCountryThunkState = {
    messageSystem: messageSystemInitialState,
    geolocation: geolocationInitialState,
};
const getState = () => state;

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
    let addEventListener: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        mockRefresh.mockClear();
        addEventListener = jest
            .spyOn(AppState, 'addEventListener')
            .mockImplementation(() => ({ remove: jest.fn() }));
        addEventListener.mockClear();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    const getAppStateListeners = () =>
        addEventListener.mock.calls
            .filter(([type]) => type === 'change')
            .map(([, listener]) => listener as (appState: AppStateStatus) => void);

    it('runPresenceDetectionThunk allows the IP lookup', async () => {
        const { runPresenceDetectionThunk } = await loadThunks();
        const { dispatch } = createMockDispatch({ getState });

        await runPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledWith({ isIpLookupAllowed: true });
    });

    it('initPresenceDetectionThunk runs immediately and then on every check interval', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch } = createMockDispatch({ getState });

        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('initPresenceDetectionThunk adds the app state listener once', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch } = createMockDispatch({ getState });

        await initPresenceDetectionThunk()(dispatch, getState, {});
        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(getAppStateListeners()).toHaveLength(1);
    });

    it.each([
        ['active', 1],
        ['background', 0],
    ] as const satisfies [AppStateStatus, number][])(
        'app state %s triggers %d presence detection runs',
        async (appState, expectedRuns) => {
            const { initPresenceDetectionThunk } = await loadThunks();
            const { dispatch } = createMockDispatch({ getState });

            await initPresenceDetectionThunk()(dispatch, getState, {});
            mockRefresh.mockClear();

            getAppStateListeners().forEach(listener => listener(appState));
            await jest.advanceTimersByTimeAsync(0);

            expect(mockRefresh).toHaveBeenCalledTimes(expectedRuns);
        },
    );
});
