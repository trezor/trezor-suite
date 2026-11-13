import { type DesktopApiDep } from '@suite/desktop-app-api';
import {
    type GeolocationRootState,
    geolocationActions,
    selectDevicePresenceSignals,
} from '@suite-common/geolocation';
import {
    PRESENCE_CHECK_INTERVAL_MS,
    type RefreshPresenceIpCountryThunkState,
    buildDesktopDeviceSignals,
    buildWebDeviceSignals,
    refreshPresenceIpCountryThunk,
} from '@suite-common/regions';
import { PollingController } from '@suite-common/suite-utils';
import { isDesktop } from '@trezor/env-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { scheduleAction } from '@trezor/utils';

const SYSTEM_LOCALE_TIMEOUT_MS = 2_000;

const presencePolling = new PollingController();

const readSystemLocale = async (desktopApi: DesktopApiDep<'getSystemLocale'>['desktopApi']) => {
    try {
        return await scheduleAction(() => desktopApi.getSystemLocale(), {
            timeout: SYSTEM_LOCALE_TIMEOUT_MS,
        });
    } catch {
        return undefined;
    }
};

export type RefreshDevicePresenceSignalsThunkState = GeolocationRootState;

export type RefreshDevicePresenceSignalsThunkDeps = WithServices<DesktopApiDep<'getSystemLocale'>>;

export const refreshDevicePresenceSignalsThunk = createThunk<
    void,
    void,
    {
        state: RefreshDevicePresenceSignalsThunkState;
        extra: RefreshDevicePresenceSignalsThunkDeps;
    }
>('@suite/regions/refreshDevicePresenceSignals', async (_, { dispatch, getState, extra }) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

    if (!isDesktop()) {
        dispatch(
            geolocationActions.setDevicePresenceSignals(
                buildWebDeviceSignals({ timeZone, languages: navigator.languages ?? [] }),
            ),
        );

        return;
    }

    const locale = await readSystemLocale(extra.services.desktopApi);
    const previous = selectDevicePresenceSignals(getState());

    dispatch(
        geolocationActions.setDevicePresenceSignals(
            locale
                ? buildDesktopDeviceSignals({ timeZone, locale })
                : {
                      timeZone,
                      primaryRegion: previous?.primaryRegion ?? null,
                      secondaryRegions: previous?.secondaryRegions ?? [],
                  },
        ),
    );
});

export type RunPresenceDetectionThunkState = RefreshDevicePresenceSignalsThunkState &
    RefreshPresenceIpCountryThunkState;

export type RunPresenceDetectionThunkDeps = RefreshDevicePresenceSignalsThunkDeps;

export const runPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: RunPresenceDetectionThunkState; extra: RunPresenceDetectionThunkDeps }
>('@suite/regions/runPresenceDetection', async (_, { dispatch }) => {
    await Promise.all([
        dispatch(refreshDevicePresenceSignalsThunk()),
        dispatch(refreshPresenceIpCountryThunk()),
    ]);
});

export type InitPresenceDetectionThunkState = RunPresenceDetectionThunkState;

export type InitPresenceDetectionThunkDeps = RunPresenceDetectionThunkDeps;

export const initPresenceDetectionThunk = createThunk<
    void,
    void,
    { state: InitPresenceDetectionThunkState; extra: InitPresenceDetectionThunkDeps }
>('@suite/regions/initPresenceDetection', async (_, { dispatch }) => {
    const run = async () => {
        await dispatch(runPresenceDetectionThunk());
    };

    await presencePolling.restart(run, PRESENCE_CHECK_INTERVAL_MS);
});
