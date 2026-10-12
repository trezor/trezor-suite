import { configureStore } from '@reduxjs/toolkit';

import { defaultEarnStakingWorkerBaseUrl } from '@suite-common/earn-staking-api';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    selectAutodetectLanguage,
    selectEarnStakingWorkerBaseUrl,
    selectLanguage,
    selectTheme,
} from './settingsSelectors';
import {
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
});
