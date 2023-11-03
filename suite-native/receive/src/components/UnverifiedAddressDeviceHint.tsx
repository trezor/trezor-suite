import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Box, VStack, Button, Text } from '@suite-native/atoms';
import { useToast } from '@suite-native/toasts';
import { Translation, useTranslate } from '@suite-native/intl';

export const UnverifiedAddressDeviceHint = () => {
    const { showToast } = useToast();
    const { translate } = useTranslate();

    // TODO: https://github.com/trezor/trezor-suite/issues/9776
    const handlePress = () => {
        showToast({
            variant: 'default',
            message: 'TODO: show informational modal',
            icon: 'warningCircle',
        });
    };

    return (
        <Animated.View entering={FadeIn}>
            <VStack spacing="medium">
                <Text variant="hint" color="textSubdued" textAlign="center">
                    <Translation id="moduleReceive.receiveAddressCard.deviceHint.description" />
                </Text>
                <Box flexDirection="row" flexShrink={1} justifyContent="center">
                    <Button size="small" colorScheme="tertiaryElevation1" onPress={handlePress}>
                        {translate(
                            'moduleReceive.receiveAddressCard.deviceHint.doesNotMatchButton',
                        )}
                    </Button>
                </Box>
            </VStack>
        </Animated.View>
    );
};
