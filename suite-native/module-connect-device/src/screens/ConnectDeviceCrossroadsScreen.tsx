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
import { useTranslate } from '@suite-native/intl';
import { useDeviceConnect } from '@suite-native/device';

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
    useDeviceConnect();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const { translate } = useTranslate();

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
