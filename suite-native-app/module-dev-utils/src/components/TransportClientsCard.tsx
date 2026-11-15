import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { injectReloadApp } from '@suite-common/suite-types';
import { Box, Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import {
    type NativeDebugTransport,
    selectDebugTransports,
    setDebugTransports,
} from '@suite-native/settings';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

const transportItems: { name: NativeDebugTransport; description: string }[] = [
    {
        name: 'BridgeTransport',
        description:
            'Connect through the bridge at http://127.0.0.1:21328/, including Trezor emulators.',
    },
    {
        name: 'NativeUsbTransport',
        description: 'Connect to Trezor devices over USB.',
    },
    {
        name: 'NativeBluetoothTransport',
        description: 'Connect to Trezor devices over Bluetooth.',
    },
];

const availableTransports = transportItems.filter(
    transport => transport.name !== 'NativeUsbTransport' || Platform.OS === 'android',
);

export const TransportClientsCard = () => {
    const debugTransports = useSelector(selectDebugTransports);
    const { dispatch, reloadApp } = useServices(injectDispatch, injectReloadApp);

    const toggleTransport = (name: NativeDebugTransport) => {
        const nextTransports = debugTransports.includes(name)
            ? debugTransports.filter(transport => transport !== name)
            : [...debugTransports, name];

        dispatch(setDebugTransports(nextTransports));
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Transport clients</Text>
                <Text>
                    Override TrezorConnect transport clients. Leave all unchecked to use automatic
                    selection. Restart the app to apply changes.
                </Text>
                {availableTransports.map(transport => (
                    <VStack key={transport.name} spacing="sp4">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                                <Text>{transport.name}</Text>
                            </Box>
                            <CheckBox
                                testID={`@settings/debug/transport/${transport.name}`}
                                isChecked={debugTransports.includes(transport.name)}
                                onChange={() => toggleTransport(transport.name)}
                            />
                        </HStack>
                        <Text variant="body-sm" color="contentSecondary">
                            {transport.description}
                        </Text>
                    </VStack>
                ))}
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={() => dispatch(setDebugTransports([]))}
                >
                    Restore automatic selection
                </Button>
                <Button onPress={reloadApp}>Restart app</Button>
            </VStack>
        </Card>
    );
};
