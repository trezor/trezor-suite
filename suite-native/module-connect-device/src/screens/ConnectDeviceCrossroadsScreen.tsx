import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { VStack, Card, Button, Text, Pictogram } from '@suite-native/atoms';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { selectDeviceState } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

const cardStyle = prepareNativeStyle<{ flex: 1 | 2 }>((utils, { flex }) => ({
    flex,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: utils.spacings.extraLarge,
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
    RootStackParamList
>;

export const ConnectDeviceCrossroadsScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const deviceState = useSelector(selectDeviceState);

    useEffect(() => {
        // When we have device state hash, we are sure that device is connected and authorized
        if (deviceState) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [deviceState, navigation]);

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleConnectDevice = () => {
        navigation.navigate(RootStackRoutes.ConnectDevice, {
            screen: ConnectDeviceStackRoutes.ConnectAndUnlockDevice,
        });
    };

    return (
        <Screen>
            <VStack spacing="medium" flex={1}>
                <Card style={applyStyle(cardStyle, { flex: 2 })}>
                    <VStack spacing="large" justifyContent="center" alignItems="center">
                        <Pictogram
                            icon="trezor"
                            variant="green"
                            title={translate(
                                'moduleConnectDevice.connectCrossroads.gotMyTrezor.title',
                            )}
                            subtitle={translate(
                                'moduleConnectDevice.connectCrossroads.gotMyTrezor.description',
                            )}
                            size="large"
                        />
                        <Button onPress={handleConnectDevice} size="large">
                            {translate(
                                'moduleConnectDevice.connectCrossroads.gotMyTrezor.connectButton',
                            )}
                        </Button>
                    </VStack>
                </Card>
                <Card style={applyStyle(cardStyle, { flex: 1 })}>
                    <VStack spacing="large" justifyContent="center" alignItems="center">
                        <VStack spacing="small" alignItems="center">
                            <Text variant="titleSmall" textAlign="center">
                                {translate('moduleConnectDevice.connectCrossroads.syncCoins.title')}
                            </Text>
                            <Text color="textSubdued" textAlign="center">
                                {translate(
                                    'moduleConnectDevice.connectCrossroads.syncCoins.description',
                                )}
                            </Text>
                        </VStack>
                        <Button
                            onPress={handleSyncMyCoins}
                            colorScheme="tertiaryElevation1"
                            size="large"
                        >
                            {translate(
                                'moduleConnectDevice.connectCrossroads.syncCoins.syncButton',
                            )}
                        </Button>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
