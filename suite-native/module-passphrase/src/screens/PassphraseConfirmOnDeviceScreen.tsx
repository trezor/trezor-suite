import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Box, Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectIsDeviceConnectedAndAuthorized } from '@suite-common/wallet-core';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { DeviceTS3Svg } from '../assets/DeviceTS3Svg';
import { cancelPassphraseAndSelectStandardDeviceThunk } from '../passphraseThunks';

const buttonStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseConfirmOnDevice,
    RootStackParamList
>;

export const PassphraseConfirmOnDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();

    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);

    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized) {
            navigation.navigate(PassphraseStackRoutes.PassphraseLoading);
        }
    }, [isDeviceConnectedAndAuthorized, navigation]);

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
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack
                spacing="large"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="small"
            >
                <DeviceTS3Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
                <Box style={applyStyle(buttonStyle)}>
                    <Button
                        colorScheme="redElevation0"
                        testID="passphrase-confrim-on-device-close-button"
                        onPress={handleClose}
                    >
                        <Translation id="modulePassphrase.confirmOnDevice.button" />
                    </Button>
                </Box>
            </VStack>
        </Screen>
    );
};
