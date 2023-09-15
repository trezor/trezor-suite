import { Box, CheckBox, Text, VStack, Card } from '@suite-native/atoms';
import { useIsDeviceConnectEnabled } from '@suite-native/feature-flags';

export const FeatureFlags = () => {
    const { isDeviceConnectEnabled, setIsDeviceConnectEnabled } = useIsDeviceConnectEnabled();
    return (
        <Card>
            <VStack spacing="small">
                <Text variant="titleSmall">Feature Flags</Text>
                <VStack>
                    <Box flexDirection="row" justifyContent="space-between">
                        <Text>Connect device</Text>
                        <CheckBox
                            isChecked={isDeviceConnectEnabled}
                            onChange={setIsDeviceConnectEnabled}
                        />
                    </Box>
                </VStack>
            </VStack>
        </Card>
    );
};
