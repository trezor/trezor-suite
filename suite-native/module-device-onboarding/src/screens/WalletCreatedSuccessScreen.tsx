import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/core';

import { AnimatedText, Box, Spinner, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletCreatedSuccess,
    RootStackParamList
>;

const NAVIGATION_TIMEOUT = 3000;
const ANIMATION_END_FRAME = 305;

export const WalletCreatedSuccessScreen = () => {
    const textOpacity = useSharedValue(0);
    const navigation = useNavigation<NavigationProps>();

    const handleAnimationEnd = () => {
        textOpacity.value = withTiming(1);
        setTimeout(() => {
            navigation.navigate(DeviceOnboardingStackRoutes.WalletBackupRecap);
        }, NAVIGATION_TIMEOUT);
    };

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <Screen isScrollable={false}>
            <Box justifyContent="center" alignItems="center" flex={1}>
                <VStack alignItems="center" spacing="sp20">
                    <Spinner
                        loadingState="success"
                        onComplete={handleAnimationEnd}
                        endFrame={ANIMATION_END_FRAME}
                        size={80}
                    />
                    <AnimatedText style={textStyle} variant="titleSmall">
                        <Translation id="moduleDeviceOnboarding.walletCreatedSuccessScreen.successLabel" />
                    </AnimatedText>
                </VStack>
            </Box>
        </Screen>
    );
};
