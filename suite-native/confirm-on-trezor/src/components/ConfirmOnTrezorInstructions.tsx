import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ConfirmOnTrezorAnimation } from './ConfirmOnTrezorAnimation';

const containerStyle = prepareNativeStyle(() => ({
    marginTop: '25%',
}));

export const ConfirmOnTrezorInstructions = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack flex={1} alignItems="center" spacing="sp20" style={applyStyle(containerStyle)}>
            {/* TODO: Replace with the new animation */}
            <ConfirmOnTrezorAnimation />
            <Box>
                <Text variant="headline-sm" textAlign="center">
                    <Translation id="device.continueOnTrezor.title" />
                </Text>
                <Text variant="body-sm" textAlign="center">
                    <Translation id="device.continueOnTrezor.subtitle" />
                </Text>
            </Box>
        </VStack>
    );
};
