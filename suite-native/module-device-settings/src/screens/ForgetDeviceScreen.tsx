import { Button, IconListTextItem, type IconListTextItemProps, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { useForgetDevice } from '../hooks/useForgetDevice';

const ListItem = ({ icon, children }: Pick<IconListTextItemProps, 'icon' | 'children'>) => (
    <IconListTextItem icon={icon} iconSize="large" variant="yellow" textVariant="body-md">
        {children}
    </IconListTextItem>
);

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
                <VStack spacing="sp24">
                    <ListItem icon="linkBreak">
                        <Translation id="moduleDeviceSettings.forgetDevice.info.list.item1" />
                    </ListItem>
                    {isKnownBluetoothDevice && (
                        <ListItem icon="bluetoothSlash">
                            <Translation id="moduleDeviceSettings.forgetDevice.info.list.item2" />
                        </ListItem>
                    )}
                    <ListItem icon="scroll">
                        <Translation id="moduleDeviceSettings.forgetDevice.info.list.item3" />
                    </ListItem>
                </VStack>
                <Button onPress={forgetDevice} intent="warning">
                    <Translation id="moduleDeviceSettings.forgetDevice.info.submitButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
