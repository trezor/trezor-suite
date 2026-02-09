import { Card, Text, VStack } from '@suite-native/atoms';

import { FirmwareUpdateChannelSelect } from './FirmwareUpdateChannelSelect';

export const FirmwareSourceCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="titleSmall">Firmware Source</Text>
            <FirmwareUpdateChannelSelect />
        </VStack>
    </Card>
);
