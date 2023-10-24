import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useConnectDevice } from '@suite-native/device';
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
import { useTranslate } from '@suite-native/intl';
import {
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';

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
    useConnectDevice();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const device = useSelector(selectDevice);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const { translate } = useTranslate();
    const { hideAlert, showAlert } = useAlert();

    useEffect(() => {
        if (device && !isDeviceInitialized) {
            showAlert({
                title: translate('moduleConnectDevice.connectCrossroadsScreen.noSeedModal.title'),
                description: translate(
                    'moduleConnectDevice.connectCrossroadsScreen.noSeedModal.description',
                ),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate(
                    'moduleConnectDevice.connectCrossroadsScreen.noSeedModal.button',
                ),
            });
        }
    }, [device, hideAlert, isDeviceInitialized, showAlert, translate]);

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [hideAlert, isDeviceConnectedAndAuthorized, navigation]);

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
                                'moduleConnectDevice.connectCrossroadsScreen.gotMyTrezor.title',
                            )}
                            subtitle={translate(
                                'moduleConnectDevice.connectCrossroadsScreen.gotMyTrezor.description',
                            )}
                            size="large"
                        />
                        <Button onPress={handleConnectDevice} size="large">
                            {translate(
                                'moduleConnectDevice.connectCrossroadsScreen.gotMyTrezor.connectButton',
                            )}
                        </Button>
                    </VStack>
                </Card>
                <Card style={applyStyle(cardStyle, { flex: 1 })}>
                    <VStack spacing="large" justifyContent="center" alignItems="center">
                        <VStack spacing="small" alignItems="center">
                            <Text variant="titleSmall" textAlign="center">
                                {translate(
                                    'moduleConnectDevice.connectCrossroadsScreen.syncCoins.title',
                                )}
                            </Text>
                            <Text color="textSubdued" textAlign="center">
                                {translate(
                                    'moduleConnectDevice.connectCrossroadsScreen.syncCoins.description',
                                )}
                            </Text>
                        </VStack>
                        <Button
                            testID="@onboarding/import/without-trezor"
                            onPress={handleSyncMyCoins}
                            colorScheme="tertiaryElevation1"
                            size="large"
                        >
                            {translate(
                                'moduleConnectDevice.connectCrossroadsScreen.syncCoins.syncButton',
                            )}
                        </Button>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
