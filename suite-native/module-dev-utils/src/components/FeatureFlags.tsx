import { useDispatch, useSelector } from 'react-redux';

import { disposeAllLocalFirstStorageThunk } from '@suite-common/local-first-storage';
import { Box, Card, CheckBox, Text, VStack } from '@suite-native/atoms';
import {
    FeatureFlag as FeatureFlagEnum,
    FeatureFlagsRootState,
    featureFlagsInitialState,
    selectIsFeatureFlagEnabled,
    useFeatureFlag,
    useToggleFeatureFlag,
} from '@suite-native/feature-flags';
import { initNativeLocalFirstStorageThunk } from '@suite-native/local-first-storage';

const featureFlagsTitleMap = {
    [FeatureFlagEnum.IsDeviceConnectEnabled]: 'Connect device',
    [FeatureFlagEnum.IsBluetoothEnabled]: 'Bluetooth',
    [FeatureFlagEnum.AreDebugOnlyNetworksEnabled]: '🧪 Debug only networks',
    [FeatureFlagEnum.IsCardanoSendEnabled]: 'Cardano send',
    [FeatureFlagEnum.IsConnectPopupEnabled]: 'Connect Popup',
    [FeatureFlagEnum.IsDebugKeysAllowed]: 'Device Auth Check Debug Keys',
    [FeatureFlagEnum.IsWalletConnectEnabled]: 'WalletConnect',
    [FeatureFlagEnum.IsTradingBuyEnabled]: '💰 Trading Buy',
    [FeatureFlagEnum.IsTradingExchangeEnabled]: '💰 Trading Swap',
    [FeatureFlagEnum.IsTradingSellEnabled]: '💰 Trading Sell',
    [FeatureFlagEnum.AreTradingExchangeDexesEnabled]: '💰 Trading Exchange Dexes Enabled',
    [FeatureFlagEnum.IsLocalizationEnabled]: '🌍 Localization',
    [FeatureFlagEnum.IsLocalFirstStorageEnabled]: 'Local First Storage (Labels)',
} as const satisfies Record<FeatureFlagEnum, string>;

const FeatureFlag = ({ featureFlag }: { featureFlag: FeatureFlagEnum }) => {
    const dispatch = useDispatch();
    const value = useFeatureFlag(featureFlag);
    const toggleFeatureFlag = useToggleFeatureFlag(featureFlag);

    const originalIsLocalFirstStorageEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlagEnum.IsLocalFirstStorageEnabled),
    );

    const onChange = () => {
        if (featureFlag === FeatureFlagEnum.IsLocalFirstStorageEnabled) {
            if (!originalIsLocalFirstStorageEnabled) {
                dispatch(initNativeLocalFirstStorageThunk());
            } else {
                dispatch(disposeAllLocalFirstStorageThunk());
            }
        }

        toggleFeatureFlag();
    };

    return (
        <Box flexDirection="row" justifyContent="space-between">
            <Text>{`${featureFlagsTitleMap[featureFlag]} [${featureFlagsInitialState[featureFlag]}]`}</Text>
            <CheckBox isChecked={value} onChange={onChange} />
        </Box>
    );
};

export const FeatureFlags = () => (
    <Card>
        <VStack spacing="sp8">
            <Text variant="titleSmall">Feature Flags [default value]</Text>
            <VStack>
                {Object.values(FeatureFlagEnum).map(featureFlag => (
                    <FeatureFlag key={featureFlag} featureFlag={featureFlag} />
                ))}
            </VStack>
        </VStack>
    </Card>
);
