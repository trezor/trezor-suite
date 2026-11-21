/** @jest-environment jsdom */
import { type SystemLocale } from '@suite/desktop-app-api';
import {
    type DevicePresenceSignals,
    geolocationActions,
    geolocationInitialState,
} from '@suite-common/geolocation';
import { PRESENCE_CHECK_INTERVAL_MS } from '@suite-common/regions';
import { mock } from '@trezor/dependency-injection';
import { isDesktop } from '@trezor/env-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import type * as PresenceDetectionThunks from './presenceDetectionThunks';

const mockRefresh = jest.fn();
const mockRefreshResult = jest.fn<Promise<void>, []>(() => Promise.resolve());

jest.mock('@suite-common/regions', () => ({
    ...jest.requireActual('@suite-common/regions'),
    refreshPresenceIpCountryThunk: () => {
        mockRefresh();

        return () => mockRefreshResult();
    },
}));

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isDesktop: jest.fn(() => false),
}));

const createExtra = (
    getSystemLocale = mock<() => Promise<SystemLocale>>(() =>
        Promise.resolve({ regionCode: 'CZ', preferredLanguages: ['de-DE'] }),
    ),
): PresenceDetectionThunks.InitPresenceDetectionThunkDeps => ({
    services: { desktopApi: { getSystemLocale } },
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

const createDispatch = (
    deviceSignals: DevicePresenceSignals | null = null,
    extra = createExtra(),
) => {
    const state: PresenceDetectionThunks.RunPresenceDetectionThunkState = {
        geolocation: { ...geolocationInitialState, deviceSignals },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    return { actions, dispatch, getState, extra };
};

const getDeviceSignalsActions = (actions: unknown[]) =>
    actions.filter(action => geolocationActions.setDevicePresenceSignals.match(action as never));

const SYDNEY_AU: DevicePresenceSignals = {
    timeZone: 'Australia/Sydney',
    primaryRegion: 'AU',
    secondaryRegions: [],
};

const SYDNEY_CZ: DevicePresenceSignals = { ...SYDNEY_AU, primaryRegion: 'CZ' };

describe('presenceDetectionThunks', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockRefresh.mockClear();
        mockRefreshResult.mockImplementation(() => Promise.resolve());
        jest.mocked(isDesktop).mockReturnValue(false);
        jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
            ...new Intl.DateTimeFormat().resolvedOptions(),
            timeZone: 'Australia/Sydney',
        });
        Object.defineProperty(navigator, 'languages', {
            value: ['en-AU'],
            configurable: true,
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('initPresenceDetectionThunk runs immediately and then on every check interval', async () => {
        const { initPresenceDetectionThunk } = await loadThunks();
        const { dispatch, getState, extra } = createDispatch();

        await initPresenceDetectionThunk()(dispatch, getState, extra);

        expect(mockRefresh).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(PRESENCE_CHECK_INTERVAL_MS);

        expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    describe('refreshDevicePresenceSignalsThunk', () => {
        it('reads the web browser languages without the desktop API', async () => {
            const { refreshDevicePresenceSignalsThunk } = await loadThunks();
            const { actions, dispatch, getState, extra } = createDispatch();

            await refreshDevicePresenceSignalsThunk()(dispatch, getState, extra);

            expect(extra.services.desktopApi.getSystemLocale).not.toHaveBeenCalled();
            expect(getDeviceSignalsActions(actions)).toEqual([
                geolocationActions.setDevicePresenceSignals(SYDNEY_AU),
            ]);
        });

        it('reads the OS region on desktop', async () => {
            jest.mocked(isDesktop).mockReturnValue(true);
            const { refreshDevicePresenceSignalsThunk } = await loadThunks();
            const { actions, dispatch, getState, extra } = createDispatch();

            await refreshDevicePresenceSignalsThunk()(dispatch, getState, extra);

            expect(extra.services.desktopApi.getSystemLocale).toHaveBeenCalledTimes(1);
            expect(getDeviceSignalsActions(actions)).toEqual([
                geolocationActions.setDevicePresenceSignals(SYDNEY_CZ),
            ]);
        });

        it.each([
            ['the system locale request fails', () => Promise.reject(new Error('IPC error'))],
            ['the system locale is missing', () => Promise.resolve(undefined as never)],
        ])(
            'updates the time zone and keeps the stored regions when %s',
            async (_description, getSystemLocale) => {
                jest.mocked(isDesktop).mockReturnValue(true);
                const { refreshDevicePresenceSignalsThunk } = await loadThunks();
                const { actions, dispatch, getState, extra } = createDispatch(
                    { timeZone: 'Europe/Prague', primaryRegion: 'CZ', secondaryRegions: [] },
                    createExtra(mock<() => Promise<SystemLocale>>(getSystemLocale)),
                );

                await refreshDevicePresenceSignalsThunk()(dispatch, getState, extra);

                expect(getDeviceSignalsActions(actions)).toEqual([
                    geolocationActions.setDevicePresenceSignals(SYDNEY_CZ),
                ]);
            },
        );

        it('stores only the time zone when the system locale fails before any region is known', async () => {
            jest.mocked(isDesktop).mockReturnValue(true);
            const { refreshDevicePresenceSignalsThunk } = await loadThunks();
            const { actions, dispatch, getState, extra } = createDispatch(
                null,
                createExtra(mock<() => Promise<SystemLocale>>(() => Promise.reject(new Error()))),
            );

            await refreshDevicePresenceSignalsThunk()(dispatch, getState, extra);

            expect(getDeviceSignalsActions(actions)).toEqual([
                geolocationActions.setDevicePresenceSignals({
                    timeZone: 'Australia/Sydney',
                    primaryRegion: null,
                    secondaryRegions: [],
                }),
            ]);
        });

        it('stores device signals while the IP fetch is still pending', async () => {
            mockRefreshResult.mockImplementation(() => new Promise(() => {}));
            const { runPresenceDetectionThunk } = await loadThunks();
            const { actions, dispatch, getState, extra } = createDispatch();

            void runPresenceDetectionThunk()(dispatch, getState, extra);
            await jest.advanceTimersByTimeAsync(0);

            expect(getDeviceSignalsActions(actions)).toHaveLength(1);
        });
    });
});
