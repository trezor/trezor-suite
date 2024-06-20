import { VStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const IncompatibleFirmwareModalAppendix = () => {
    return (
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.title" />
            </Text>
            <Box>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.1" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.2" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.incompatibleFirmwareModalAppendix.lines.3" />
                </Text>
            </Box>
        </VStack>
    );
};
