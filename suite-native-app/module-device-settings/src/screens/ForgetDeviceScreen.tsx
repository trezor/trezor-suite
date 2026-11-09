import { Button, IconList, IconListTextItem, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { useForgetDevice } from '../hooks/useForgetDevice';

export const ForgetDeviceScreen = () => {
    const { isKnownBluetoothDevice, forgetDevice } = useForgetDevice();

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.forgetDevice.info.title" />}
                />
            }
        >
            <VStack justifyContent="space-between" flex={1}>
                <IconList iconIntent="warning" textVariant="body-md">
                    <IconListTextItem icon="linkBreak">
                        <Translation id="moduleDeviceSettings.forgetDevice.info.list.item1" />
                    </IconListTextItem>
                    {isKnownBluetoothDevice && (
                        <IconListTextItem icon="bluetoothSlash">
                            <Translation id="moduleDeviceSettings.forgetDevice.info.list.item2" />
                        </IconListTextItem>
                    )}
                    <IconListTextItem icon="scroll">
                        <Translation id="moduleDeviceSettings.forgetDevice.info.list.item3" />
                    </IconListTextItem>
                </IconList>
                <Button onPress={forgetDevice} intent="warning">
                    <Translation id="moduleDeviceSettings.forgetDevice.info.submitButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
