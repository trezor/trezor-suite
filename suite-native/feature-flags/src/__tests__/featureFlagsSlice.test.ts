describe('featureFlagsSlice', () => {
    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state for debug environment on android', () => {
            jest.mock('@suite-native/config', () => ({
                ...jest.requireActual('@suite-native/config'),
                isDebugEnv: () => true,
                isDevelopOrDebugEnv: () => true,
            }));
            jest.mock('@trezor/env-utils', () => ({
                ...jest.requireActual('@trezor/env-utils'),
                isAndroid: () => true,
            }));

            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: true,
                isCardanoSendEnabled: true,
                isRegtestEnabled: true,
                isConnectPopupEnabled: true,
                isTradingEnabled: true,
                isDeviceOnboardingEnabled: true,
                IsFwRevisionCheckEnabled: true,
            });
        });

        it('should have correct initial state for production environment on android', () => {
            jest.mock('@suite-native/config', () => ({
                ...jest.requireActual('@suite-native/config'),
                isDebugEnv: () => false,
                isDevelopOrDebugEnv: () => false,
            }));
            jest.mock('@trezor/env-utils', () => ({
                ...jest.requireActual('@trezor/env-utils'),
                isAndroid: () => true,
            }));

            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: true,
                isCardanoSendEnabled: false,
                isRegtestEnabled: false,
                isConnectPopupEnabled: false,
                isTradingEnabled: false,
                isDeviceOnboardingEnabled: false,
                IsFwRevisionCheckEnabled: false,
            });
        });

        it('should have correct initial state for production environment on iOS', () => {
            jest.mock('@suite-native/config', () => ({
                ...jest.requireActual('@suite-native/config'),
                isDebugEnv: () => false,
                isDevelopOrDebugEnv: () => false,
            }));
            jest.mock('@trezor/env-utils', () => ({
                ...jest.requireActual('@trezor/env-utils'),
                isAndroid: () => false,
            }));

            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: false,
                isCardanoSendEnabled: false,
                isRegtestEnabled: false,
                isConnectPopupEnabled: false,
                isTradingEnabled: false,
                isDeviceOnboardingEnabled: false,
                IsFwRevisionCheckEnabled: false,
            });
        });
    });

    describe('toggleFeatureFlag', () => {
        it('should toggle feature flag', () => {
            const { featureFlagsReducer, toggleFeatureFlag } = require('../featureFlagsSlice');

            const state = featureFlagsReducer(
                undefined,
                toggleFeatureFlag({ featureFlag: 'isDeviceConnectEnable' }),
            );
            expect(state.isDeviceConnectEnabled).toEqual(false);

            const state2 = featureFlagsReducer(
                state,
                toggleFeatureFlag({ featureFlag: 'isDeviceConnectEnabled' }),
            );
            expect(state2.isDeviceConnectEnabled).toEqual(true);
        });
    });

    describe('selectIsFeatureFlagEnabled', () => {
        it('should return correct value', () => {
            const {
                featureFlagsReducer,
                toggleFeatureFlag,
                selectIsFeatureFlagEnabled,
            } = require('../featureFlagsSlice');

            const state = featureFlagsReducer(
                undefined,
                toggleFeatureFlag({ featureFlag: 'isDeviceConnectEnabled' }),
            );

            expect(
                selectIsFeatureFlagEnabled({ featureFlags: state }, 'isDeviceConnectEnabled'),
            ).toEqual(true);
        });
    });
});
