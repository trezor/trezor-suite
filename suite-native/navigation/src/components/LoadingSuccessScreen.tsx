import { ReactNode } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedText, Box, Spinner, VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

type LoadingSuccessScreenProps = {
    onFinish: () => void;
    title: ReactNode;
};

const NAVIGATION_TIMEOUT = 3000;
const ANIMATION_END_FRAME = 305;

export const LoadingSuccessScreen = ({ onFinish, title }: LoadingSuccessScreenProps) => {
    const textOpacity = useSharedValue(0);

    const handleAnimationEnd = () => {
        textOpacity.value = withTiming(1);
        setTimeout(() => {
            onFinish();
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
                        {title}
                    </AnimatedText>
                </VStack>
            </Box>
        </Screen>
    );
};
