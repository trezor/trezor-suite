import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import {
    selectAutodetectLanguage,
    selectContactsRelayUrls,
    selectLanguage,
    selectTheme,
} from './settingsSelectors';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from './settingsSlice';

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

    it('has no contacts relay by default', () => {
        const store = initStore();

        expect(selectContactsRelayUrls(store.getState())).toEqual([]);
    });

    it('stores only valid contacts relay URLs', () => {
        const store = initStore();

        store.dispatch(
            suiteSettingsActions.setContactsRelayUrls([
                'wss://relay.example.com',
                'ws://relay.example.com',
                'https://relay.example.com',
                ' ws://127.0.0.1:7777 ',
                'wss://relay.example.com',
            ]),
        );

        expect(selectContactsRelayUrls(store.getState())).toEqual([
            'wss://relay.example.com',
            'ws://127.0.0.1:7777',
        ]);

        store.dispatch(suiteSettingsActions.setContactsRelayUrls([]));

        expect(selectContactsRelayUrls(store.getState())).toEqual([]);
    });
});
