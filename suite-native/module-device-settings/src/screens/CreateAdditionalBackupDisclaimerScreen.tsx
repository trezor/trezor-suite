import { useNavigation } from '@react-navigation/native';

import {
    type CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { DisclaimerScreenContent } from '@suite-native/nfc';

type NavigationProp = StackNavigationProps<
    CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes.Disclaimer
>;

export const CreateAdditionalBackupDisclaimerScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleContinue = () => {
        navigation.navigate(CreateAdditionalBackupStackRoutes.HowItWorks);
    };

    return (
        <Screen header={<ScreenHeader />}>
            <DisclaimerScreenContent onContinue={handleContinue} />
        </Screen>
    );
};
