import { Box, CheckBox, Text, VStack, Card } from '@suite-native/atoms';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

export const FeatureFlags = () => {
    const { isUsbDeviceConnectFeatureEnabled, setIsUsbDeviceConnectFeatureEnabled } =
        useIsUsbDeviceConnectFeatureEnabled();

    return (
        <Card>
            <VStack spacing="small">
                <Text variant="titleSmall">Feature Flags</Text>
                <VStack>
                    <Box flexDirection="row" justifyContent="space-between">
                        <Text>Connect device</Text>
                        <CheckBox
                            isChecked={isUsbDeviceConnectFeatureEnabled}
                            onChange={setIsUsbDeviceConnectFeatureEnabled}
                        />
                    </Box>
                </VStack>
            </VStack>
        </Card>
    );
};
