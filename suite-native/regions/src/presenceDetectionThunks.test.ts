import { geolocationInitialState } from '@suite-common/geolocation';
import {
    PRESENCE_CHECK_INTERVAL_MS,
    type RefreshPresenceIpCountryThunkState,
} from '@suite-common/regions';
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

const state: RefreshPresenceIpCountryThunkState = {
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
        const { dispatch } = createMockDispatch({ getState });

        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });
});
