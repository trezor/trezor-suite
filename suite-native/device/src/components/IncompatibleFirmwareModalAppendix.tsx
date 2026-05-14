import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const IncompatibleFirmwareModalAppendix = () => (
    <VStack>
        <Text variant="body-sm-strong">
            <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.title" />
        </Text>
        <Box>
            <Text color="contentSecondary">
                <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.1" />
            </Text>
            <Text color="contentSecondary">
                <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.2" />
            </Text>
            <Text color="contentSecondary">
                <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.3" />
            </Text>
        </Box>
    </VStack>
);
