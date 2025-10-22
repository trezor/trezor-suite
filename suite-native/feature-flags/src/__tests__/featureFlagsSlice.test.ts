import { Platform } from 'react-native';

describe('featureFlagsSlice', () => {
    afterEach(() => {
        Platform.OS = 'ios';
        jest.resetModules();
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state on iOS', () => {
            Platform.OS = 'ios';
            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: true,
                isBluetoothEnabled: true,
                areDebugOnlyNetworksEnabled: false,
                isCardanoSendEnabled: false,
                isDebugKeysAllowed: false,
                isLocalFirstStorageEnabled: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingSellEnabled: false,
                areTradingExchangeDexesEnabled: false,
                isTradingResidenceCheckEnabled: true,
                isLocalizationEnabled: false,
            });
        });

        it('should have correct initial state on android', () => {
            Platform.OS = 'android';
            const { featureFlagsReducer } = require('../featureFlagsSlice');

            const initialState = featureFlagsReducer(undefined, { type: 'undefined_action' });

            expect(initialState).toEqual({
                isDeviceConnectEnabled: true,
                isBluetoothEnabled: true,
                areDebugOnlyNetworksEnabled: false,
                isCardanoSendEnabled: false,
                isDebugKeysAllowed: false,
                isLocalFirstStorageEnabled: false,
                isTradingBuyEnabled: false,
                isTradingExchangeEnabled: false,
                isTradingSellEnabled: false,
                areTradingExchangeDexesEnabled: false,
                isTradingResidenceCheckEnabled: false,
                isLocalizationEnabled: false,
            });
        });
    });

    describe('toggleFeatureFlag', () => {
        it('should toggle feature flag', () => {
            const { featureFlagsReducer, toggleFeatureFlag } = require('../featureFlagsSlice');

            const state = featureFlagsReducer(
                undefined,
                toggleFeatureFlag({ featureFlag: 'isDeviceConnectEnabled' }),
            );
            expect(state.isDeviceConnectEnabled).toEqual(false);

            const state2 = featureFlagsReducer(
                state,
                toggleFeatureFlag({ featureFlag: 'isDeviceConnectEnabled' }),
            );
            expect(state2.isDeviceConnectEnabled).toEqual(true);
        });
    });
});
