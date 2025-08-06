import { IconListItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const BluetoothPairingHints = () => (
    <VStack spacing="sp16">
        <IconListItem icon="power" iconSize="large" variant="blue">
            <Text variant="hint">
                <Translation id="moduleConnectDevice.helpModal.pairing.hints.hint1" />
            </Text>
        </IconListItem>
        <IconListItem icon="trezorSafe5" iconSize="large" variant="blue">
            <Text variant="hint">
                <Translation id="moduleConnectDevice.helpModal.pairing.hints.hint2" />
            </Text>
        </IconListItem>
    </VStack>
);
