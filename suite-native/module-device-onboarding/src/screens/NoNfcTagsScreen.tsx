import { ScrollView } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { BackupAlternativeCard } from '@suite-native/nfc';

export const NoNfcTagsScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.NoNfcTags>) => {
    const handleFinishSetup = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.WalletCreation, {
            walletBackupType: 'shamir-single',
            skipBackup: true,
        });
    };

    const handleCreateWordlistBackup = () => {
        // Navigate to WalletBackupTutorial with skipNfcBranch to show the wordlist type selector.
        navigation.navigate(DeviceOnboardingStackRoutes.WalletBackupTutorial, {
            skipNfcBranch: true,
        });
    };

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <ScrollView>
                <VStack spacing="sp16" paddingBottom="sp16">
                    <Text textAlign="center" variant="body-sm-strong" color="contentBrand">
                        <Translation id="moduleNfcOnboarding.noNfcTags.callout" />
                    </Text>
                    <Text textAlign="center" variant="headline-md">
                        <Translation id="moduleNfcOnboarding.noNfcTags.title" />
                    </Text>
                    <Text textAlign="center" variant="body-md" color="contentSecondary">
                        <Translation id="moduleNfcOnboarding.noNfcTags.subtitle" />
                    </Text>
                </VStack>

                <VStack spacing="sp16">
                    <BackupAlternativeCard
                        badgeLabel="moduleNfcOnboarding.noNfcTags.finishSetup.badge"
                        badgeIntent="info"
                        title="moduleNfcOnboarding.noNfcTags.finishSetup.title"
                        description="moduleNfcOnboarding.noNfcTags.finishSetup.description"
                        buttonLabel="moduleNfcOnboarding.noNfcTags.finishSetup.button"
                        onPress={handleFinishSetup}
                    />
                    <BackupAlternativeCard
                        badgeLabel="moduleNfcOnboarding.noNfcTags.wordlistBackup.badge"
                        title="moduleNfcOnboarding.noNfcTags.wordlistBackup.title"
                        description="moduleNfcOnboarding.noNfcTags.wordlistBackup.description"
                        buttonLabel="moduleNfcOnboarding.noNfcTags.wordlistBackup.button"
                        onPress={handleCreateWordlistBackup}
                        buttonPriority="secondary"
                    />
                </VStack>
            </ScrollView>
        </Screen>
    );
};
