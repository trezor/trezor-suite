import { ReactNode } from 'react';
import { Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBox, IconButton, VStack } from '@suite-native/atoms';
import { getWindowHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SwipeableWalkthroughStepHeader } from './SwipeableWalkthroughStepHeader';

export type SwipeableWalkthroughStepProps = {
    children: ReactNode;
    currentStepIndex: SharedValue<number>;
    totalSteps: number;
    title?: ReactNode;
    callout?: ReactNode;
    description?: ReactNode;
    continueButton?: ReactNode;
};

const SCREEN_HEADER_HEIGHT = 80;

const SPRING_ANIMATION_CONFIG = {
    damping: 24,
    mass: 1,
    stiffness: 115,
};

const stepContainerStyle = prepareNativeStyle<{ height: number }>((_, { height }) => ({
    height,
}));

const scrollViewContentStyle = prepareNativeStyle<{
    safeAreaInsetBottom: number;
    height: number;
}>((utils, { safeAreaInsetBottom, height }) => ({
    minHeight: height,
    paddingHorizontal: utils.spacings.sp16,
    // On iOS is the bottom bar transparent, so we need to add extra bottom padding to avoid content being rendered in the bottom bar.
    paddingBottom: Platform.OS === 'ios' ? safeAreaInsetBottom + utils.spacings.sp16 : 0,
}));

export const SwipeableWalkthroughStep = ({
    totalSteps,
    callout,
    title,
    description,
    children,
    currentStepIndex,
    continueButton,
}: SwipeableWalkthroughStepProps) => {
    const { top: topSafeAreaInset, bottom: bottomSafeAreaInset } = useSafeAreaInsets();

    const stepContainerHeight =
        getWindowHeight() -
        (SCREEN_HEADER_HEIGHT -
            (Platform.OS === 'ios' ? bottomSafeAreaInset - topSafeAreaInset : 0));

    const { applyStyle } = useNativeStyles();

    const walkthroughStepAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withSpring(
                    -stepContainerHeight * currentStepIndex.value,
                    SPRING_ANIMATION_CONFIG,
                ),
            },
        ],
    }));

    const handleNextButtonPress = () => {
        if (currentStepIndex.value < totalSteps - 1) {
            currentStepIndex.value += 1;
        }
    };

    return (
        <AnimatedBox
            style={[
                walkthroughStepAnimatedStyle,
                applyStyle(stepContainerStyle, { height: stepContainerHeight }),
            ]}
        >
            <ScrollView
                bounces={false}
                contentContainerStyle={applyStyle(scrollViewContentStyle, {
                    safeAreaInsetBottom: bottomSafeAreaInset,
                    height: stepContainerHeight,
                })}
            >
                <SwipeableWalkthroughStepHeader
                    callout={callout}
                    title={title}
                    description={description}
                />
                <VStack spacing="sp24" alignItems="center" flex={1}>
                    {children}
                    {continueButton ?? (
                        <IconButton
                            iconName="caretDown"
                            colorScheme="tertiaryElevation0"
                            size="large"
                            onPress={handleNextButtonPress}
                        />
                    )}
                </VStack>
            </ScrollView>
        </AnimatedBox>
    );
};
