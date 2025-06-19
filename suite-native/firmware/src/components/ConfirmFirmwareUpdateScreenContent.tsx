import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { FirmwareChangelogButton } from '../components/FirmwareChangelogButton';
import { FirmwareUpdateVersionCard } from '../components/FirmwareVersionCard';

export const ConfirmFirmwareUpdateScreenContent = () => (
    <VStack spacing="sp32">
        <VStack>
            <Text variant="titleMedium">
                <Translation id="firmware.firmwareUpdateScreen.title" />
            </Text>
            <Text variant="body" color="textSubdued">
                <Translation id="firmware.firmwareUpdateScreen.subtitle" />
            </Text>
        </VStack>
        <VStack>
            <FirmwareUpdateVersionCard />
            <FirmwareChangelogButton />
        </VStack>
    </VStack>
);
