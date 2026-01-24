import { Card, Text, VStack } from '@suite-native/atoms';

import { FirmwareUpdateEnvironmentSelect } from './FirmwareUpdateEnvironmentSelect';

export const FirmwareSourceCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="titleSmall">Firmware Source</Text>
            <FirmwareUpdateEnvironmentSelect />
        </VStack>
    </Card>
);
