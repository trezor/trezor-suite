import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { useNativeServices } from '@suite-native/services';
import { clearStorage } from '@suite-native/storage';

export const DangerZoneCard = () => {
    const { getMMKVStorage } = useNativeServices();

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Danger Zone</Text>
                <VStack>
                    <Button
                        colorScheme="redBold"
                        onPress={() => {
                            getMMKVStorage().then(mmkv => {
                                clearStorage({ mmkvInstance: mmkv });
                            });
                        }}
                    >
                        💥 Wipe all data
                    </Button>
                </VStack>
            </VStack>
        </Card>
    );
};
