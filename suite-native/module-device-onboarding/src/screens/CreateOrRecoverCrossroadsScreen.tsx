import { Box, Button, Card, CenteredTitleHeader, TextDivider, VStack } from '@suite-native/atoms';
import { EmptyWalletSvg } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

const cardStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const CreateOrRecoverCrossroadsScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads
>) => {
    const { showToast } = useToast();
    const { applyStyle } = useNativeStyles();
    const handleCreateButtonPress = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.CreateWalletLoading);
    };

    const handleRecoverButtonPress = () => {
        showToast({
            message: 'Not implemented yet',
            variant: 'warning',
        });
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack spacing="sp24" flex={1} justifyContent="space-between">
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
                            <Button onPress={handleCreateButtonPress}>
                                <Translation id="moduleDeviceOnboarding.createOrRecoverCrossroadsScreen.create.button" />
                            </Button>
                        </VStack>
                    </Box>
                </Card>
                <VStack spacing="sp24" flexShrink={1}>
                    <TextDivider />
                    <VStack spacing="sp16">
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
