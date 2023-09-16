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

const cardStyle = prepareNativeStyle<{ flex: 1 | 2 }>((utils, { flex }) => ({
    flex,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: utils.spacings.extraLarge,
}));

const textStyle = prepareNativeStyle(_ => ({
    textAlign: 'center',
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
    RootStackParamList
>;

export const ConnectDeviceCrossroadsScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();

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
                    <VStack spacing="large">
                        <Pictogram
                            icon="trezor"
                            variant="green"
                            title={"I've got my Trezor"}
                            subtitle="Connect to manage your assets"
                            size="large"
                        />
                        <Button onPress={handleConnectDevice}>Connect Trezor</Button>
                    </VStack>
                </Card>
                <Card style={applyStyle(cardStyle, { flex: 1 })}>
                    <VStack spacing="large" justifyContent="center" alignItems="center">
                        <VStack spacing="small" alignItems="center">
                            <Text variant="titleSmall" style={applyStyle(textStyle)}>
                                Sync coins without your Trezor
                            </Text>
                            <Text color="textSubdued" style={applyStyle(textStyle)}>
                                Track your favorite coins anytime, anywhere, even when your Trezor
                                isn't connected.
                            </Text>
                        </VStack>
                        <Button onPress={handleSyncMyCoins} colorScheme="tertiaryElevation0">
                            Sync my coins
                        </Button>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
