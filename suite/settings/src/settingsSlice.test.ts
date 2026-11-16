import { configureStore } from '@reduxjs/toolkit';

import { defaultEarnStakingWorkerBaseUrl } from '@suite-common/earn-staking-api';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    selectAutodetectLanguage,
    selectEarnStakingWorkerBaseUrl,
    selectIsServiceWorkerDevLogsEnabled,
    selectIsServiceWorkerEnabled,
    selectIsServiceWorkerUpdatePromptEnabled,
    selectLanguage,
    selectTheme,
} from './settingsSelectors';
import {
    type DebugModeOptions,
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from './settingsSlice';

const suiteSettingsReducer = prepareSuiteSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadSuiteSettings: mockReducer() },
});

const initStore = (preloadedState = suiteSettingsInitialState) =>
    configureStore({
        reducer: { suiteSettings: suiteSettingsReducer },
        preloadedState: { suiteSettings: preloadedState },
    });

describe('settingsSlice', () => {
    it('returns the initial state through selectors', () => {
        const store = initStore();

        expect(selectLanguage(store.getState())).toBe(suiteSettingsInitialState.language);
        expect(selectTheme(store.getState())).toBe(suiteSettingsInitialState.theme.variant);
        expect(selectAutodetectLanguage(store.getState())).toBe(
            suiteSettingsInitialState.autodetect.language,
        );
    });

    it('updates language', () => {
        const store = initStore();

        store.dispatch(suiteSettingsActions.setLanguage('cs-CZ'));

        expect(selectLanguage(store.getState())).toBe('cs-CZ');
    });

    it('returns the default earn staking worker base URL until another one is selected', () => {
        const store = initStore();

        expect(selectEarnStakingWorkerBaseUrl(store.getState())).toBe(
            defaultEarnStakingWorkerBaseUrl,
        );

        store.dispatch(
            suiteSettingsActions.setDebugMode({
                earnStakingWorkerBaseUrl: 'http://localhost:3001/staking/v1',
            }),
        );

        expect(selectEarnStakingWorkerBaseUrl(store.getState())).toBe(
            'http://localhost:3001/staking/v1',
        );
    });

    it('keeps the service worker off until the debug switch turns it on', () => {
        const store = initStore();

        expect(selectIsServiceWorkerEnabled(store.getState())).toBe(false);

        store.dispatch(suiteSettingsActions.setDebugMode({ isServiceWorkerEnabled: true }));

        expect(selectIsServiceWorkerEnabled(store.getState())).toBe(true);
    });

    it('keeps the service worker options off until their switches turn them on', () => {
        const store = initStore();

        expect(selectIsServiceWorkerUpdatePromptEnabled(store.getState())).toBe(false);
        expect(selectIsServiceWorkerDevLogsEnabled(store.getState())).toBe(false);

        store.dispatch(
            suiteSettingsActions.setDebugMode({
                isServiceWorkerUpdatePromptEnabled: true,
                isServiceWorkerDevLogsEnabled: true,
            }),
        );

        expect(selectIsServiceWorkerUpdatePromptEnabled(store.getState())).toBe(true);
        expect(selectIsServiceWorkerDevLogsEnabled(store.getState())).toBe(true);
    });

    it('reads debug options saved before the service worker switches existed as off', () => {
        const debugSavedByOlderVersion: DebugModeOptions = {
            transports: [],
            isUnlockedBootloaderAllowed: false,
            showConnectLogs: false,
            isN4w1BackupEnabled: false,
            showTranslationKeys: false,
            isAppsEmbeddingEnabled: false,
        };
        const store = initStore({ ...suiteSettingsInitialState, debug: debugSavedByOlderVersion });

        expect(selectIsServiceWorkerEnabled(store.getState())).toBe(false);
        expect(selectIsServiceWorkerUpdatePromptEnabled(store.getState())).toBe(false);
        expect(selectIsServiceWorkerDevLogsEnabled(store.getState())).toBe(false);
    });
});
