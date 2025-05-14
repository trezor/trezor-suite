import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SettingsCardWithIconLayout } from '@suite-native/settings';

export const WipeDeviceCard = () => (
    <SettingsCardWithIconLayout
        title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
        icon="arrowsClockwise"
    >
        <VStack marginTop="sp2" spacing="sp16">
            <Text variant="body" color="textSubdued">
                <Translation id="moduleDeviceSettings.wipeDevice.content" />
            </Text>
            <Box flex={1}>
                <Button colorScheme="redBold">
                    <Translation id="moduleDeviceSettings.wipeDevice.buttonTitle" />
                </Button>
            </Box>
        </VStack>
    </SettingsCardWithIconLayout>
);
