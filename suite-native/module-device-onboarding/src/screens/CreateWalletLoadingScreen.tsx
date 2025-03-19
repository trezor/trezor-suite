import { useEffect } from 'react';

import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CreateWalletLoader, LOADER_DURATION } from '../components/CreateWalletLoader';

const titleStyle = prepareNativeStyle(_ => ({
    // this title should have smaller letter spacing by design.
    letterSpacing: -1.4,
}));

export const CreateWalletLoadingScreen = () => {
    const { showToast } = useToast();
    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            showToast({
                message: 'Loading finished, TODO: redirect to next screen',
                variant: 'warning',
            });
            // delaying the redirect a bit feels more natural than redirecting right after the animation ends.
        }, LOADER_DURATION + 300);

        return () => clearTimeout(timeoutId);
    }, [showToast]);

    return (
        <Screen>
            <Box justifyContent="center" alignItems="center" flex={1}>
                <VStack spacing="sp20">
                    <CreateWalletLoader />
                    <Text variant="titleMedium" style={applyStyle(titleStyle)} textAlign="center">
                        <Translation id="moduleDeviceOnboarding.createWalletLoadingScreen.title" />
                    </Text>
                </VStack>
            </Box>
        </Screen>
    );
};
