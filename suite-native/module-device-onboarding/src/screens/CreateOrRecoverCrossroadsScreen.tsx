import { useSetAtom } from 'jotai';

import { Box, Button, Card, CenteredTitleHeader, TextDivider, VStack } from '@suite-native/atoms';
import { EmptyWalletSvg } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderOnElevation1,
}));

export const CreateOrRecoverCrossroadsScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads
>) => {
    const { applyStyle } = useNativeStyles();
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const isDeviceOnboardingRecoveryEnabled = useFeatureFlag(
        FeatureFlag.IsDeviceOnboardingRecoveryEnabled,
    );

    const handleCreateButtonPress = () => {
        updateOnboardingAnalytics({
            seed: 'create',
        });
        navigation.navigate(DeviceOnboardingStackRoutes.CreateWalletLoading);
    };

    const handleRecoverButtonPress = () => {
        updateOnboardingAnalytics({
            seed: 'recovery',
        });

        if (isDeviceOnboardingRecoveryEnabled) {
            navigation.navigate(DeviceOnboardingStackRoutes.RecoveryInstructions);
        } else {
            navigation.navigate(DeviceOnboardingStackRoutes.RecoveryUnsupported);
        }
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack spacing="sp24" flex={1} justifyContent="space-between" marginBottom="sp16">
                <Card style={applyStyle(cardStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="center">
                        <Box flex={1} justifyContent="center" paddingVertical="sp12">
                            <EmptyWalletSvg />
                        </Box>
                        <VStack spacing="sp16">
                            <CenteredTitleHeader
                                titleVariant="highlight"
                                titleSpacing="sp4"
                                title={
                                    <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.create.title" />
                                }
                                subtitle={
                                    <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.create.subtitle" />
                                }
                            />
                            <Button
                                testID="@deviceOnboarding/CreateOrRecoverCrossroadsScreen/createWalletBtn"
                                onPress={handleCreateButtonPress}
                            >
                                <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.create.button" />
                            </Button>
                        </VStack>
                    </Box>
                </Card>
                <VStack spacing="sp24" flexShrink={1}>
                    <TextDivider />
                    <VStack spacing="sp16" paddingHorizontal="sp16">
                        <CenteredTitleHeader
                            titleVariant="highlight"
                            titleSpacing="sp4"
                            title={
                                <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.recover.title" />
                            }
                            subtitle={
                                <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.recover.subtitle" />
                            }
                        />
                        <Button onPress={handleRecoverButtonPress} colorScheme="tertiaryElevation0">
                            <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.recover.button" />
                        </Button>
                    </VStack>
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
