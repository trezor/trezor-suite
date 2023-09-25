import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { selectDevice } from '@suite-common/wallet-core';
import { ConnectDeviceStackRoutes, RootStackRoutes, AppTabsRoutes } from '@suite-native/navigation';
import { Icon } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

const LOADING_TIMEOUT = 2500;

export const ConnectingDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();
    const device = useSelector(selectDevice);
    const navigation = useNavigation();

    useEffect(() => {
        if (!device?.state) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
            });
        } else {
            setTimeout(() => {
                navigation.navigate(RootStackRoutes.AppTabs, {
                    screen: AppTabsRoutes.HomeStack,
                });
            }, LOADING_TIMEOUT);
        }
    }, [device, navigation]);

    return (
        <ConnectDeviceBackground style={applyStyle(screenStyle)}>
            <VStack spacing="medium" alignItems="center">
                <VStack spacing="extraLarge" alignItems="center">
                    <Icon name="trezor" size="extraLarge" />
                    <Text variant="titleMedium">Connecting</Text>
                </VStack>
                <Text variant="highlight" color="textSubdued">
                    Hodl on tight
                </Text>
            </VStack>
        </ConnectDeviceBackground>
    );
};
