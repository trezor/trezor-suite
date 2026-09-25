import { suiteSettingsInitialState } from '@suite/settings';
import { type Dispatch } from '@suite-common/redux-utils';

import { createMetadataProviderCache } from './createMetadataProviderCache';
import { getProviderInstanceThunk } from './metadataProviderThunks';
import { initialMetadataState } from './metadataReducer';
import { type FetchIntervalTrackingId } from './metadataUtils';
import { FileSystemProvider } from './providers/FileSystemProvider';

const CLIENT_ID = 'fileSystem';
const FETCH_INTERVAL_ID = `labels-${CLIENT_ID}-static-session-id` as FetchIntervalTrackingId;

const getState = () =>
    ({
        metadata: {
            ...initialMetadataState,
            providers: [{ type: 'fileSystem', clientId: CLIENT_ID, data: {} }],
        },
        suiteSettings: suiteSettingsInitialState,
    }) as any;

const dispatch: Dispatch = jest.fn();

type ThunkExtra = Parameters<ReturnType<typeof getProviderInstanceThunk>>[2];

const createExtra = (metadataProviderCache = createMetadataProviderCache()): ThunkExtra => ({
    services: {
        desktopApi: {
            metadataGetFiles: jest.fn(() => Promise.resolve({ success: true, payload: [] })),
        } as unknown as ThunkExtra['services']['desktopApi'],
        metadataProviderCache,
    },
});

describe(getProviderInstanceThunk.name, () => {
    it('reuses the provider instance cached by the same composition root', () => {
        const extra = createExtra();
        const thunk = getProviderInstanceThunk({ clientId: CLIENT_ID, dataType: 'labels' });

        const first = thunk(dispatch, getState, extra);
        const second = thunk(dispatch, getState, extra);

        expect(first).toBeInstanceOf(FileSystemProvider);
        expect(second).toBe(first);
        expect(extra.services.metadataProviderCache.instances.labels).toBe(first);
    });

    it('binds each composition root to its own provider instance and desktop API', async () => {
        const extraA = createExtra();
        const extraB = createExtra();
        const thunk = getProviderInstanceThunk({ clientId: CLIENT_ID, dataType: 'labels' });

        const providerA = thunk(dispatch, getState, extraA);
        const providerB = thunk(dispatch, getState, extraB);

        expect(providerA).not.toBe(providerB);

        await providerB?.getFilesList();

        expect(extraB.services.desktopApi.metadataGetFiles).toHaveBeenCalledTimes(1);
        expect(extraA.services.desktopApi.metadataGetFiles).not.toHaveBeenCalled();
    });

    it('drops cached instances and polling timers on dispose', () => {
        jest.useFakeTimers();
        const cache = createMetadataProviderCache();
        const extra = createExtra(cache);
        const thunk = getProviderInstanceThunk({ clientId: CLIENT_ID, dataType: 'labels' });
        let ticks = 0;

        thunk(dispatch, getState, extra);
        cache.fetchIntervals[FETCH_INTERVAL_ID] = setInterval(() => {
            ticks += 1;
        }, 1000);

        cache.dispose();
        jest.advanceTimersByTime(5000);

        expect(cache.instances.labels).toBeUndefined();
        expect(cache.fetchIntervals).toEqual({});
        expect(ticks).toBe(0);
        jest.useRealTimers();
    });
});
