import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { isBluetoothBuild, isBluetoothEnabled, setBluetoothEnabled } from '@suite-native/bluetooth';

export const BluetoothCard = () => (
    <Card>
        <VStack>
            <Text variant="titleSmall">Bluetooth</Text>
            {isBluetoothBuild ? (
                <VStack marginTop="sp8" spacing="sp12">
                    {!isBluetoothEnabled ? (
                        <Button onPress={() => setBluetoothEnabled(true)}>Enable Bluetooth</Button>
                    ) : (
                        <Button colorScheme="redBold" onPress={() => setBluetoothEnabled(false)}>
                            Disable Bluetooth
                        </Button>
                    )}
                </VStack>
            ) : (
                <Text>Not a Bluetooth build.</Text>
            )}
        </VStack>
    </Card>
);
