import { Platform } from 'react-native';

describe('featureFlagsSlice', () => {
    afterEach(() => {
        Platform.OS = 'ios';
        jest.resetModules();
        jest.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state on iOS', () => {
            Platform.OS = 'ios';
            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                areDebugOnlyNetworksEnabled: false,
                areExperimentalOnlyNetworksEnabled: false,
                areTradingExchangeDexesEnabled: false,
                isCardanoSendEnabled: false,
                isDebugKeysAllowed: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingResidenceCheckEnabled: true,
                isTradingSellEnabled: false,
                isTradingDebugEnabled: false,
                isN4w1BackupEnabled: false,
                isEarnEnabled: false,
                isStablecoinYieldEnabled: false,
            });
        });

        it('should have correct initial state on android', () => {
            Platform.OS = 'android';
            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                areDebugOnlyNetworksEnabled: false,
                areExperimentalOnlyNetworksEnabled: false,
                isCardanoSendEnabled: false,
                isDebugKeysAllowed: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingSellEnabled: false,
                areTradingExchangeDexesEnabled: false,
                isTradingResidenceCheckEnabled: false,
                isTradingDebugEnabled: false,
                isN4w1BackupEnabled: false,
                isEarnEnabled: false,
                isStablecoinYieldEnabled: false,
            });
        });
    });

    describe('toggleFeatureFlag', () => {
        it('should toggle feature flag', () => {
            const { featureFlagsReducer, toggleFeatureFlag } = require('../featureFlagsSlice');

            const state = featureFlagsReducer(
                undefined,
                toggleFeatureFlag({ featureFlag: 'areDebugOnlyNetworksEnabled' }),
            );
            expect(state.areDebugOnlyNetworksEnabled).toEqual(true);

            const state2 = featureFlagsReducer(
                state,
                toggleFeatureFlag({ featureFlag: 'areDebugOnlyNetworksEnabled' }),
            );
            expect(state2.areDebugOnlyNetworksEnabled).toEqual(false);
        });
    });
});
