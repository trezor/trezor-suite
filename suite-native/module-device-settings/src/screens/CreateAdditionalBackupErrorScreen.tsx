import { useOpenLink } from '@suite-native/link';
import {
    Screen,
    ScreenHeader,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { ErrorScreenContent } from '@suite-native/nfc';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

export const CreateAdditionalBackupErrorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const openLink = useOpenLink();

    const handleClose = () => {
        navigateToInitialScreen();
    };

    const handleContactSupport = () => {
        openLink(TREZOR_SUPPORT_URL);
    };

    useOverrideBackNavigation({ onNavigateBack: handleClose });

    return (
        <Screen header={<ScreenHeader closeActionType="close" closeAction={handleClose} />}>
            <ErrorScreenContent onContactSupport={handleContactSupport} onClose={handleClose} />
        </Screen>
    );
};
