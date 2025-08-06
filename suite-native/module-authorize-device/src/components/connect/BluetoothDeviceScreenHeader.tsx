import { ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

export const BluetoothDeviceScreenHeader = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return <ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />;
};
