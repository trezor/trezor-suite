import { Box, Card, CheckBox, Text, VStack } from '@suite-native/atoms';
import {
    FeatureFlag as FeatureFlagEnum,
    featureFlagsInitialState,
    useFeatureFlag,
    useToggleFeatureFlag,
} from '@suite-native/feature-flags';

const featureFlagsTitleMap = {
    [FeatureFlagEnum.IsDeviceConnectEnabled]: 'Connect device',
    [FeatureFlagEnum.IsCardanoSendEnabled]: 'Cardano send',
    [FeatureFlagEnum.IsStellarSupportEnabled]: 'Stellar network',
    [FeatureFlagEnum.IsConnectPopupEnabled]: 'Connect Popup',
    [FeatureFlagEnum.IsDeviceOnboardingRecoveryEnabled]: 'Device onboarding - recovery',
    [FeatureFlagEnum.IsDebugKeysAllowed]: 'Device Auth Check Debug Keys',
    [FeatureFlagEnum.IsWalletConnectEnabled]: 'WalletConnect',
    [FeatureFlagEnum.IsTradingBuyEnabled]: '💰 Trading Buy',
    [FeatureFlagEnum.IsTradingExchangeEnabled]: '💰 Trading Swap',
    [FeatureFlagEnum.IsTradingSellEnabled]: '💰 Trading Sell',
} as const satisfies Record<FeatureFlagEnum, string>;

const FeatureFlag = ({ featureFlag }: { featureFlag: FeatureFlagEnum }) => {
    const value = useFeatureFlag(featureFlag);
    const toggleFeatureFlag = useToggleFeatureFlag(featureFlag);

    return (
        <Box flexDirection="row" justifyContent="space-between">
            <Text>{`${featureFlagsTitleMap[featureFlag]} [${featureFlagsInitialState[featureFlag]}]`}</Text>
            <CheckBox isChecked={value} onChange={toggleFeatureFlag} />
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
