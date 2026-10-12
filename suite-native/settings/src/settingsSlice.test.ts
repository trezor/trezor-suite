import {
    type AppSettingsState,
    appSettingsPersistWhitelist,
    appSettingsReducer,
    selectEarnStakingWorkerBaseUrl,
    selectIsExperimentalFeatureEnabled,
    setEarnStakingWorkerEnvironment,
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

describe('appSettingsSlice earn staking worker base URL', () => {
    it('should have no base URL selected initially', () => {
        expect(selectEarnStakingWorkerBaseUrl(asRootState(getInitialState()))).toBeUndefined();
    });

    it('should store the selected base URL', () => {
        const state = appSettingsReducer(
            getInitialState(),
            setEarnStakingWorkerEnvironment('http://localhost:3001/staking/v1'),
        );

        expect(selectEarnStakingWorkerBaseUrl(asRootState(state))).toBe(
            'http://localhost:3001/staking/v1',
        );
    });

    it('should keep the selected base URL across app restarts', () => {
        expect(appSettingsPersistWhitelist).toContain('earnStakingWorkerBaseUrl');
    });
});
