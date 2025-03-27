import { useEffect } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CreateWalletLoader, LOADER_DURATION } from '../components/CreateWalletLoader';

const titleStyle = prepareNativeStyle(_ => ({
    // this title should have smaller letter spacing by design.
    letterSpacing: -1.4,
}));

export const CreateWalletLoadingScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<DeviceOnboardingStackParamList>;
}) => {
    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            navigation.navigate(DeviceOnboardingStackRoutes.WalletBackupTutorial);
        }, LOADER_DURATION);

        return () => clearTimeout(timeoutId);
    }, [navigation]);

    return (
        <Screen isScrollable={false}>
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
