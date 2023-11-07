import { Box, VStack, Text, Pictogram, TrezorSuiteLiteHeader } from '@suite-native/atoms';

export const ReceiveTextHint = () => (
    <VStack spacing="m" paddingVertical="extraLarge">
        <Box marginVertical="m" paddingHorizontal="m">
            <Pictogram
                variant="yellow"
                icon="warningTriangleLight"
                title={
                    <Text>
                        <TrezorSuiteLiteHeader />
                        {'\n'}
                        <Text variant="titleSmall">receive address</Text>
                    </Text>
                }
                subtitle="For an extra layer of security, use Trezor Suite with your Trezor hardware
                    wallet to verify the receive address."
            />
        </Box>
    </VStack>
);
