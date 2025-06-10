describe('featureFlagsSlice', () => {
    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state on android', () => {
            jest.mock('@trezor/env-utils', () => ({
                ...jest.requireActual('@trezor/env-utils'),
                isAndroid: () => true,
            }));

            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: true,
                isCardanoSendEnabled: false,
                isStellarSupportEnabled: false,
                isConnectPopupEnabled: false,
                isDebugKeysAllowed: false,
                isWalletConnectEnabled: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingSellEnabled: false,
            });
        });

        it('should have correct initial state on iOS', () => {
            jest.mock('@trezor/env-utils', () => ({
                ...jest.requireActual('@trezor/env-utils'),
                isAndroid: () => false,
            }));

            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: false,
                isCardanoSendEnabled: false,
                isStellarSupportEnabled: false,
                isConnectPopupEnabled: false,
                isDebugKeysAllowed: false,
                isWalletConnectEnabled: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingSellEnabled: false,
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
