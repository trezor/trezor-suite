import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { selectHasExperimentalFeature } from '../settingsSelectors';
import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '../settingsSlice';

const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependenciesCommonMock);

const initStore = (preloadedState = suiteSettingsInitialState) =>
    configureStore({
        reducer: { suiteSettings: suiteSettingsReducer },
        preloadedState: { suiteSettings: preloadedState },
    });

describe('selectHasExperimentalFeature', () => {
    it('returns false when no experimental features are enabled', () => {
        const store = initStore();

        expect(selectHasExperimentalFeature(store.getState(), 'slip24')).toBe(false);
        expect(selectHasExperimentalFeature(store.getState(), 'nft-section')).toBe(false);
    });

    it('returns true when the given feature is in the experimental list', () => {
        const store = initStore({
            ...suiteSettingsInitialState,
            experimental: ['slip24', 'gap-limit'],
        });

        expect(selectHasExperimentalFeature(store.getState(), 'slip24')).toBe(true);
        expect(selectHasExperimentalFeature(store.getState(), 'gap-limit')).toBe(true);
        expect(selectHasExperimentalFeature(store.getState(), 'nft-section')).toBe(false);
    });

    it('returns identity-stable results across repeated calls with the same args', () => {
        const store = initStore({
            ...suiteSettingsInitialState,
            experimental: ['slip24'],
        });
        const state = store.getState();

        const a = selectHasExperimentalFeature(state, 'slip24');
        const b = selectHasExperimentalFeature(state, 'slip24');

        expect(a).toBe(b);
    });

    it('invalidates the cache when the experimental slice reference changes', () => {
        const store = initStore({
            ...suiteSettingsInitialState,
            experimental: ['slip24'],
        });

        expect(selectHasExperimentalFeature(store.getState(), 'nft-section')).toBe(false);

        const nextStore = initStore({
            ...suiteSettingsInitialState,
            experimental: ['slip24', 'nft-section'],
        });

        expect(selectHasExperimentalFeature(nextStore.getState(), 'nft-section')).toBe(true);
    });
});
