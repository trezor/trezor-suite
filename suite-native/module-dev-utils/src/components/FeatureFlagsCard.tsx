import { Box, Card, CheckBox, Text, VStack } from '@suite-native/atoms';
import {
    FeatureFlag as FeatureFlagEnum,
    featureFlagsInitialState,
    useFeatureFlag,
    useToggleFeatureFlag,
} from '@suite-native/feature-flags';

const featureFlagsTitleMap = {
    [FeatureFlagEnum.AreDebugOnlyNetworksEnabled]: '🧪 Debug only networks',
    [FeatureFlagEnum.AreExperimentalOnlyNetworksEnabled]: '🧪 Experimental only networks',
    [FeatureFlagEnum.IsCardanoSendEnabled]: 'Cardano send',
    [FeatureFlagEnum.IsDebugKeysAllowed]: 'Device Auth Check Debug Keys',
    [FeatureFlagEnum.IsTradingBuyEnabled]: '💰 Trading Buy',
    [FeatureFlagEnum.IsTradingExchangeEnabled]: '💰 Trading Swap',
    [FeatureFlagEnum.IsTradingSellEnabled]: '💰 Trading Sell',
    [FeatureFlagEnum.AreTradingExchangeDexesEnabled]: '💰 Trading Exchange Dexes',
    [FeatureFlagEnum.IsTradingResidenceCheckEnabled]: '💰 Trading Residence Check',
    [FeatureFlagEnum.IsTradingDebugEnabled]: '💰 Trading Debug Mode',
    [FeatureFlagEnum.IsStablecoinYieldEnabled]: 'Stablecoin Yield',
    [FeatureFlagEnum.IsN4w1BackupEnabled]: 'N4W1 Backup',
} as const satisfies Record<FeatureFlagEnum, string>;

const FeatureFlag = ({ featureFlag }: { featureFlag: FeatureFlagEnum }) => {
    const value = useFeatureFlag(featureFlag);
    const toggleFeatureFlag = useToggleFeatureFlag(featureFlag);

    const onChange = () => {
        toggleFeatureFlag();
    };

    return (
        <Box flexDirection="row" justifyContent="space-between">
            <Text>{`${featureFlagsTitleMap[featureFlag]} [${featureFlagsInitialState[featureFlag]}]`}</Text>
            <CheckBox isChecked={value} onChange={onChange} />
        </Box>
    );
};

export const FeatureFlagsCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="headline-sm">Feature Flags [default value]</Text>
            <VStack>
                {Object.values(FeatureFlagEnum).map(featureFlag => (
                    <FeatureFlag key={featureFlag} featureFlag={featureFlag} />
                ))}
            </VStack>
        </VStack>
    </Card>
);
