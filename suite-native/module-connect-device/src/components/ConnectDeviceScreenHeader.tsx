import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/core';

import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

export const ConnectDeviceScreenHeader = () => {
    const navigation = useNavigation<any>();

    const handleCancel = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            }),
        );
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
