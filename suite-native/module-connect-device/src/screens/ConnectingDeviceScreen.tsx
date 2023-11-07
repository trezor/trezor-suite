import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/core';

import { Text, VStack } from '@suite-native/atoms';
import { RootStackRoutes, HomeStackRoutes } from '@suite-native/navigation';
import { Icon } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

const LOADING_TIMEOUT = 2500;

export const ConnectingDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const navigation = useNavigation();

    useEffect(() => {
        const timerId = setTimeout(() => {
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
        }, LOADING_TIMEOUT);

        return () => clearTimeout(timerId);
    }, [navigation]);

    return (
        <ConnectDeviceBackground style={applyStyle(screenStyle)}>
            <VStack spacing="m" alignItems="center">
                <VStack spacing="extraLarge" alignItems="center">
                    <Icon name="trezor" size="extraLarge" />
                    <Text variant="titleMedium">
                        {translate('moduleConnectDevice.connectingDeviceScreen.title')}
                    </Text>
                </VStack>
                <Text variant="highlight" color="textSubdued">
                    {translate('moduleConnectDevice.connectingDeviceScreen.hodlOn')}
                </Text>
            </VStack>
        </ConnectDeviceBackground>
    );
};
