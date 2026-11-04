import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { injectReloadApp } from '@suite-common/suite-types';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { injectMMKVStorage } from '@suite-native/services';
import { clearStorage } from '@suite-native/storage';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const DangerZoneCard = () => {
    const { getMMKVStorage, reloadApp, dispatch } = useServices(
        injectMMKVStorage,
        injectReloadApp,
        injectDispatch,
    );

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
                                reloadApp();
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
