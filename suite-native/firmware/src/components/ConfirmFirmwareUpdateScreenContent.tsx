import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { FirmwareChangelogButton } from '../components/FirmwareChangelogButton';
import { FirmwareUpdateVersionCard } from '../components/FirmwareVersionCard';

export const ConfirmFirmwareUpdateScreenContent = () => (
    <>
        <Box>
            <Text variant="titleMedium">
                <Translation id="firmware.firmwareUpdateScreen.title" />
            </Text>
        </Box>
        <Box paddingTop="sp8">
            <Text variant="body" color="textSubdued">
                <Translation id="firmware.firmwareUpdateScreen.subtitle" />
            </Text>
        </Box>
        <FirmwareUpdateVersionCard marginTop="sp32" marginBottom="sp12" />
        <FirmwareChangelogButton />
    </>
);
