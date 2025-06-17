import { ComponentProps, PropsWithChildren } from 'react';
import Animated, {
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

import { Button } from '@suite-native/atoms';

type FormSubmitButtonProps = PropsWithChildren<{
    isVisible: boolean;
}> &
    ComponentProps<typeof Button>;

export const FormSubmitButton = ({
    isVisible,
    onPress,
    children,
    ...restProps
}: FormSubmitButtonProps) => {
    const animatedButtonContainerStyle = useAnimatedStyle(
        () => ({
            height: withTiming(isVisible ? 50 : 0),
        }),
        [isVisible],
    );

    return (
        <Animated.View style={animatedButtonContainerStyle}>
            {isVisible && (
                <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                    <Button onPress={onPress} {...restProps}>
                        {children}
                    </Button>
                </Animated.View>
            )}
        </Animated.View>
    );
};
