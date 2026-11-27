import { geolocationInitialState } from '@suite-common/geolocation';
import { PRESENCE_CHECK_INTERVAL_MS } from '@suite-common/regions';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import type * as PresenceDetectionThunks from './presenceDetectionThunks';

const mockRefresh = jest.fn();

jest.mock('@suite-common/regions', () => ({
    ...jest.requireActual('@suite-common/regions'),
    refreshPresenceIpCountryThunk: () => {
        mockRefresh();

        return () => Promise.resolve();
    },
}));

const state: PresenceDetectionThunks.RunPresenceDetectionThunkState = {
    geolocation: geolocationInitialState,
};

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

const createDispatch = () => {
    const getState = () => state;
    const { dispatch } = createMockDispatch({ getState });

    return { dispatch, getState };
};

describe('presenceDetectionThunks', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockRefresh.mockClear();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('initPresenceDetectionThunk runs immediately and then on every check interval', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch, getState } = createDispatch();

        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });
});
