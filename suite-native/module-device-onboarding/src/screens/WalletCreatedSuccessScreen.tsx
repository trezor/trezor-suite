import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedText, Box, Spinner, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

const NAVIGATION_TIMEOUT = 3000;
const ANIMATION_END_FRAME = 305;

export const WalletCreatedSuccessScreen = ({
    navigation,
    route,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletCreatedSuccess
>) => {
    const { flowType } = route.params;
    const textOpacity = useSharedValue(0);
    const { showToast } = useToast();

    const handleAnimationEnd = () => {
        textOpacity.value = withTiming(1);
        setTimeout(() => {
            if (flowType === 'create') {
                navigation.navigate(DeviceOnboardingStackRoutes.WalletBackupRecap);
            } else {
                // TODO: https://github.com/trezor/trezor-suite/issues/18401
                showToast({
                    message: 'TODO: implement recovery recap screen',
                    variant: 'warning',
                });
            }
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
