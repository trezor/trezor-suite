import { View, type ViewInstance } from 'react-native';
import {
    type SharedValue,
    measure,
    useAnimatedRef,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedBox } from '../Animated/AnimatedBox';

export type AccordionContentProps = {
    isOpened: SharedValue<boolean>;
    children: React.ReactNode;
};

const contentWrapperStyle = prepareNativeStyle(({ spacings }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    paddingTop: spacings.sp8,
}));

const ANIMATION_DURATION = 200;

export const AccordionContent = ({ isOpened, children }: AccordionContentProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedRef = useAnimatedRef<ViewInstance>();

    const animatedHeightStyle = useAnimatedStyle(() => ({
        height: withTiming(isOpened.value ? Number(measure(animatedRef)?.height ?? 0) : 0, {
            duration: ANIMATION_DURATION,
        }),
        overflow: 'hidden',
    }));

    return (
        <AnimatedBox style={animatedHeightStyle}>
            <View ref={animatedRef} style={applyStyle(contentWrapperStyle)} collapsable={false}>
                {children}
            </View>
        </AnimatedBox>
    );
};
