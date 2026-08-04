import { useNavigation } from '@react-navigation/native';

import { useOpenLink } from '@suite-native/link';
import {
    type CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { HowItWorksScreenContent } from '@suite-native/nfc';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

type NavigationProp = StackNavigationProps<
    CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes.HowItWorks
>;

export const CreateAdditionalBackupHowItWorksScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const openLink = useOpenLink();

    const handleStartBackup = () => {
        navigation.navigate(CreateAdditionalBackupStackRoutes.FollowInstructions);
    };

    const handleLearnMore = () => {
        openLink(HELP_CENTER_MULTI_SHARE_BACKUP_URL);
    };

    return (
        <Screen header={<ScreenHeader />}>
            <HowItWorksScreenContent
                onStartBackup={handleStartBackup}
                onLearnMore={handleLearnMore}
            />
        </Screen>
    );
};
