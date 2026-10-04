import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import {
    selectAutodetectLanguage,
    selectContactsRelayUrls,
    selectLanguage,
    selectTheme,
    selectWarddToken,
    selectWarddUrl,
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

    it('connects to the default wardd without a pairing token by default', () => {
        const store = initStore();

        expect(selectWarddUrl(store.getState())).toBe('ws://127.0.0.1:21329');
        expect(selectWarddToken(store.getState())).toBeUndefined();
    });

    it('stores the wardd connection in the debug settings', () => {
        const store = initStore();

        store.dispatch(
            suiteSettingsActions.setDebugMode({
                warddUrl: 'ws://localhost:4000',
                warddToken: 'pairing-token',
            }),
        );

        expect(selectWarddUrl(store.getState())).toBe('ws://localhost:4000');
        expect(selectWarddToken(store.getState())).toBe('pairing-token');

        store.dispatch(suiteSettingsActions.setDebugMode({ warddToken: '' }));

        expect(selectWarddToken(store.getState())).toBeUndefined();
    });

    it('never selects a stored wardd URL that is not on this machine', () => {
        const store = initStore({
            ...suiteSettingsInitialState,
            debug: { ...suiteSettingsInitialState.debug, warddUrl: 'ws://wardd.example.com' },
        });

        expect(selectWarddUrl(store.getState())).toBe('ws://127.0.0.1:21329');
    });
});
