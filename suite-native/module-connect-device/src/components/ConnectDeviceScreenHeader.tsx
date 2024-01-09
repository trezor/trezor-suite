import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

type NavigationProp = StackToTabCompositeProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleCancel = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
            />
            <ConnectingTrezorHelp />
        </ScreenHeaderWrapper>
    );
};
