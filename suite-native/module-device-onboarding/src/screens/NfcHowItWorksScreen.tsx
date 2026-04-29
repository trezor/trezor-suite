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

export const NfcHowItWorksScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.NfcHowItWorks>) => {
    const handleCreateBackup = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.WalletCreation, {
            walletBackupType: 'shamir-single',
            backupMethod: 'nfc',
        });
    };

    return (
        <Screen
            footer={
                <Box paddingHorizontal="sp16" paddingBottom="sp16">
                    <Button onPress={handleCreateBackup}>
                        <Translation id="moduleNfcOnboarding.howItWorks.createBackupButton" />
                    </Button>
                </Box>
            }
            header={<ScreenHeader closeActionType="back" />}
            isScrollable={false}
        >
            <VStack flex={1} justifyContent="center">
                <VStack
                    spacing="sp16"
                    justifyContent="space-around"
                    alignItems="center"
                    paddingTop="sp16"
                >
                    <Text variant="body-sm-strong" color="contentBrand" textAlign="center">
                        <Translation id="moduleNfcOnboarding.howItWorks.callout" />
                    </Text>
                    <Text variant="headline-md" textAlign="center">
                        <Translation id="moduleNfcOnboarding.howItWorks.title" />
                    </Text>
                </VStack>

                <Box alignItems="center" paddingVertical="sp24">
                    <NfcTagsVisual activeCount={2} />
                </Box>

                <Box paddingHorizontal="sp16">
                    <Text variant="body-md" color="contentSecondary" textAlign="center">
                        <Translation id="moduleNfcOnboarding.howItWorks.description" />
                    </Text>
                </Box>
            </VStack>
        </Screen>
    );
};
