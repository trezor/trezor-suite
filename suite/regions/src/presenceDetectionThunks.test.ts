/** @jest-environment jsdom */
import { TorStatus } from '@suite/tor';
import { PRESENCE_CHECK_INTERVAL_MS, geolocationInitialState } from '@suite-common/geolocation';
import { messageSystemInitialState } from '@suite-common/message-system';
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

const createState = (
    torStatus: TorStatus,
): PresenceDetectionThunks.RunPresenceDetectionThunkState => ({
    messageSystem: messageSystemInitialState,
    geolocation: geolocationInitialState,
    tor: { torStatus, torBootstrap: null },
});

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

const createDispatch = (torStatus = TorStatus.Disabled) => {
    const state = createState(torStatus);
    const getState = () => state;
    const { dispatch } = createMockDispatch({ getState });

    return { dispatch, getState };
};

const getVisibilityListeners = (addEventListener: jest.SpyInstance) =>
    addEventListener.mock.calls
        .filter(([type]) => type === 'visibilitychange')
        .map(([, listener]) => listener as () => void);

describe('presenceDetectionThunks', () => {
    let addEventListener: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        mockRefresh.mockClear();
        addEventListener = jest
            .spyOn(document, 'addEventListener')
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it.each([
        [TorStatus.Enabled, false],
        [TorStatus.Enabling, false],
        [TorStatus.Slow, false],
        [TorStatus.Disabling, false],
        [TorStatus.Error, false],
        [TorStatus.Disabled, true],
    ] as const)(
        'runPresenceDetectionThunk allows the IP lookup for Tor %s: %s',
        async (torStatus, isIpLookupAllowed) => {
            const { runPresenceDetectionThunk } = await loadThunks();
            const { dispatch, getState } = createDispatch(torStatus);

            await runPresenceDetectionThunk()(dispatch, getState, {});

            expect(mockRefresh).toHaveBeenCalledWith({ isIpLookupAllowed });
        },
    );

    it('initPresenceDetectionThunk runs immediately and then on every check interval', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch, getState } = createDispatch();

        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('initPresenceDetectionThunk adds the visibility listener once', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch, getState } = createDispatch();

        await initPresenceDetectionThunk()(dispatch, getState, {});
        await initPresenceDetectionThunk()(dispatch, getState, {});

        expect(getVisibilityListeners(addEventListener)).toHaveLength(1);
    });

    it('runs the presence detection when the document becomes visible', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch, getState } = createDispatch();

        await initPresenceDetectionThunk()(dispatch, getState, {});
        mockRefresh.mockClear();

        jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        getVisibilityListeners(addEventListener).forEach(listener => listener());
        await jest.advanceTimersByTimeAsync(0);

        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
});
