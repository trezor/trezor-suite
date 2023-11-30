import { VStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const BootloaderModalAppendix = () => (
    <VStack spacing="large">
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.bootloaderModal.appendix.exit.title" />
            </Text>
            <Box>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.bootloaderModal.appendix.exit.lines.1" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.bootloaderModal.appendix.exit.lines.2" />
                </Text>
            </Box>
        </VStack>
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.bootloaderModal.appendix.continue.title" />
            </Text>
            <Box>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.bootloaderModal.appendix.continue.lines.1" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.bootloaderModal.appendix.continue.lines.2" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.bootloaderModal.appendix.continue.lines.3" />
                </Text>
            </Box>
        </VStack>
    </VStack>
);
