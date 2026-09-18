import { useServices } from '@suite-common/dependency-injection';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { injectDispatch } from '@suite-common/redux-utils';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { injectMMKVStorage } from '@suite-native/services';
import { clearStorage } from '@suite-native/storage';

export const DangerZoneCard = () => {
    const { getMMKVStorage, dispatch } = useServices(injectMMKVStorage, injectDispatch);

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Danger Zone</Text>
                <VStack>
                    <Button
                        intent="critical"
                        priority="primary"
                        onPress={() => {
                            getMMKVStorage().then(mmkv => {
                                clearStorage({ mmkvInstance: mmkv });
                            });
                        }}
                    >
                        💥 Wipe all data
                    </Button>
                </VStack>
                <VStack>
                    <Button
                        intent="critical"
                        priority="primary"
                        onPress={() =>
                            dispatch(persistentDeviceDataActions.clearDevicePersistentData())
                        }
                    >
                        Clear app&apos;s device persistent data
                    </Button>
                </VStack>
            </VStack>
        </Card>
    );
};
