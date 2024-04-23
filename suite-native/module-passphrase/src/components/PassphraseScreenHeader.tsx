import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';

import { cancelPassphraseAndSelectStandardDeviceThunk } from '../passphraseThunks';

type NavigationProp = StackToTabCompositeProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const handleClose = () => {
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
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
                onPress={handleClose}
            />
        </ScreenHeaderWrapper>
    );
};
