import { ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

const supportUrlWithChat = `${TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL}#open-chat`;

export const DeviceAuthenticityCheckFailModalContent = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleClose = () => {
        navigateToInitialScreen();
    };

    const screenHeaderContent = <ScreenHeader closeActionType="close" closeAction={handleClose} />;

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={supportUrlWithChat}
            screenHeaderContent={screenHeaderContent}
        />
    );
};
