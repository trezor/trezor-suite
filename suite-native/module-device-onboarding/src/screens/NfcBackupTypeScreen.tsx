import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { NfcTagsVisual } from '@suite-native/nfc';

export const NfcBackupTypeScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.NfcBackupType>) => {
    const handleContinueWithNfc = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.NfcHowItWorks);
    };

    const handleChooseDifferentType = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.NoNfcTags);
    };

    return (
        <Screen header={<ScreenHeader closeActionType="back" />} isScrollable={false}>
            <VStack flex={1} justifyContent="space-between">
                <VStack spacing="sp16" alignItems="center" paddingTop="sp16">
                    <Text variant="body-sm-strong" color="contentBrand" textAlign="center">
                        <Translation id="moduleNfcOnboarding.backupType.callout" />
                    </Text>
                    <Text variant="headline-md" textAlign="center">
                        <Translation id="moduleNfcOnboarding.backupType.title" />
                    </Text>
                </VStack>

                <Box alignItems="center" paddingVertical="sp24">
                    <NfcTagsVisual overlapping />
                </Box>

                <Box paddingHorizontal="sp16">
                    <Text variant="body-md" color="contentSecondary" textAlign="center">
                        <Translation id="moduleNfcOnboarding.backupType.description" />
                    </Text>
                </Box>

                <VStack spacing="sp12" paddingBottom="sp16">
                    <Button onPress={handleContinueWithNfc}>
                        <Translation id="moduleNfcOnboarding.backupType.continueButton" />
                    </Button>
                    <Button
                        onPress={handleChooseDifferentType}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="moduleNfcOnboarding.backupType.chooseDifferentButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
