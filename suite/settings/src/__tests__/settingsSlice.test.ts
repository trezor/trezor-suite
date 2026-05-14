import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { selectAutodetectLanguage, selectLanguage, selectTheme } from '../settingsSelectors';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '../settingsSlice';

const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependenciesCommonMock);

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
});
