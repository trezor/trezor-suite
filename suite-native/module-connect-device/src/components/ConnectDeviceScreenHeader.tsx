import { useNavigation } from '@react-navigation/native';

import {
    ConnectDeviceStackRoutes,
    RootStackRoutes,
    ScreenHeaderWrapper,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

export const ConnectDeviceScreenHeader = () => {
    const navigation = useNavigation<any>();

    const handleCancel = () => {
        navigation.navigate(RootStackRoutes.ConnectDevice, {
            screen: ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
        });
    };

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                onPress={handleCancel}
            />
            <ConnectingTrezorHelp />
        </ScreenHeaderWrapper>
    );
};
