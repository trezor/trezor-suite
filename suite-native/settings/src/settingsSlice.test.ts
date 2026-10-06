import {
    type AppSettingsState,
    appSettingsReducer,
    selectIsExperimentalFeatureEnabled,
    toggleExperimentalFeature,
} from './settingsSlice';

const getInitialState = () => appSettingsReducer(undefined, { type: 'undefined_action' });

const asRootState = (appSettings: AppSettingsState) => ({ appSettings });

describe('appSettingsSlice experimental features', () => {
    it('should have no experimental feature enabled initially', () => {
        const state = getInitialState();

        expect(state.experimentalFeatures).toEqual([]);
        expect(selectIsExperimentalFeatureEnabled(asRootState(state), 'slip24')).toBe(false);
    });

    it('should enable and disable an experimental feature', () => {
        const enabledState = appSettingsReducer(
            getInitialState(),
            toggleExperimentalFeature('slip24'),
        );

        expect(selectIsExperimentalFeatureEnabled(asRootState(enabledState), 'slip24')).toBe(true);

        const disabledState = appSettingsReducer(enabledState, toggleExperimentalFeature('slip24'));

        expect(selectIsExperimentalFeatureEnabled(asRootState(disabledState), 'slip24')).toBe(
            false,
        );
    });

    it('should not affect other experimental features', () => {
        const state = appSettingsReducer(
            { ...getInitialState(), experimentalFeatures: ['suite-sync'] },
            toggleExperimentalFeature('slip24'),
        );

        expect(state.experimentalFeatures).toEqual(['suite-sync', 'slip24']);
    });
});
