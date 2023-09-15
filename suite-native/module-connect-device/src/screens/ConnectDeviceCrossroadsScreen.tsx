import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    ConnectDeviceStackRoutes,
    RootStackRoutes,
    Screen,
} from '@suite-native/navigation';
import { VStack, Box, Card, Button, Text, Pictogram } from '@suite-native/atoms';

export const ConnectDeviceCrossroadsScreen = () => {
    const navigation = useNavigation<any>();

    // TODO this should also happen if user connects before tapping on this button
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
            <VStack spacing="medium">
                <Card style={{ flex: 2 }}>
                    <Box>
                        <Pictogram
                            icon="trezor"
                            variant="green"
                            title={"I've got my Trezor"}
                            subtitle="Connect to manage your assets"
                        />
                        <Button onPress={handleConnectDevice}>Connect Trezor</Button>
                    </Box>
                </Card>
                <Card style={{ flex: 1 }}>
                    <Box justifyContent="center" alignItems="center">
                        <Text variant="titleSmall">Sync coins without your Trezor</Text>
                        <Text color="textSubdued">
                            Track your favorite coins anytime, anywhere, even when your Trezor isn't
                            connected.
                        </Text>
                        <Button onPress={handleSyncMyCoins} colorScheme="tertiaryElevation0">
                            Sync my coins
                        </Button>
                    </Box>
                </Card>
            </VStack>
            <Button>Settings</Button>
        </Screen>
    );
};
