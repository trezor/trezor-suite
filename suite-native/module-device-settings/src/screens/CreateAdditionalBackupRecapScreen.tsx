import {
    Screen,
    ScreenHeader,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { RecapScreenContent } from '@suite-native/nfc';

export const CreateAdditionalBackupRecapScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useOverrideBackNavigation({ onNavigateBack: navigateToInitialScreen });

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />}
        >
            <RecapScreenContent onClose={navigateToInitialScreen} />
        </Screen>
    );
};
