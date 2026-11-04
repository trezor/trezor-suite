import {
    type AppSettingsState,
    type ExperimentalFeature,
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
        expect(selectIsExperimentalFeatureEnabled(asRootState(state), 'native-navigation')).toBe(
            false,
        );
    });

    it.each(['slip24', 'native-navigation'] satisfies ExperimentalFeature[])(
        'should enable and disable %s without affecting other experimental features',
        feature => {
            const initialState: AppSettingsState = {
                ...getInitialState(),
                experimentalFeatures: ['suite-sync'],
            };
            const enabledState = appSettingsReducer(
                initialState,
                toggleExperimentalFeature(feature),
            );

            expect(selectIsExperimentalFeatureEnabled(asRootState(enabledState), feature)).toBe(
                true,
            );
            expect(enabledState.experimentalFeatures).toEqual(['suite-sync', feature]);

            const disabledState = appSettingsReducer(
                enabledState,
                toggleExperimentalFeature(feature),
            );

            expect(selectIsExperimentalFeatureEnabled(asRootState(disabledState), feature)).toBe(
                false,
            );
            expect(disabledState.experimentalFeatures).toEqual(['suite-sync']);
            expect(initialState.experimentalFeatures).toEqual(['suite-sync']);
        },
    );
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
