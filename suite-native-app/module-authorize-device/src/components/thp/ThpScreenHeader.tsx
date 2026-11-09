import { ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

export const ThpScreenHeader = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const cancelInteraction = () => {
        TrezorConnect.cancel();
        navigateToInitialScreen();
    };

    return <ScreenHeader closeActionType="close" closeAction={cancelInteraction} />;
};
