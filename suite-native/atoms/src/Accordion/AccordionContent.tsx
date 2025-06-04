import { View } from 'react-native';
import {
    SharedValue,
    measure,
    useAnimatedRef,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AnimatedBox } from '../Box';

export type AccordionContentProps = {
    isOpened: SharedValue<boolean>;
    style?: NativeStyleObject;
    children: React.ReactNode;
};

const contentWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
}));

const ANIMATION_DURATION = 200;

export const AccordionContent = ({ isOpened, children }: AccordionContentProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedRef = useAnimatedRef<View>();

    const animatedHeightStyle = useAnimatedStyle(() => ({
        height: withTiming(isOpened.value ? Number(measure(animatedRef)?.height ?? 0) : 0, {
            duration: ANIMATION_DURATION,
        }),
        overflow: 'hidden',
    }));

    return (
        <AnimatedBox style={animatedHeightStyle}>
            <View style={applyStyle(contentWrapperStyle)}>
                <View ref={animatedRef} collapsable={false}>
                    {children}
                </View>
            </View>
        </AnimatedBox>
    );
};
