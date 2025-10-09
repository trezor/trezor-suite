describe('featureFlagsSlice', () => {
    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
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
