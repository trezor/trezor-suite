import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { RootStackRoutes, AppTabsRoutes } from '@suite-native/navigation';
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
        setTimeout(() => {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
            });
        }, LOADING_TIMEOUT);
    }, [navigation]);

    return (
        <ConnectDeviceBackground style={applyStyle(screenStyle)}>
            <VStack spacing="medium" alignItems="center">
                <VStack spacing="extraLarge" alignItems="center">
                    <Icon name="trezor" size="extraLarge" />
                    <Text variant="titleMedium">
                        {translate('moduleConnectDevice.connectingDevice.title')}
                    </Text>
                </VStack>
                <Text variant="highlight" color="textSubdued">
                    {translate('moduleConnectDevice.connectingDevice.hodlOn')}
                </Text>
            </VStack>
        </ConnectDeviceBackground>
    );
};
