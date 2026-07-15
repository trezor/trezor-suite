/* eslint-disable react-hooks/immutability */
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
    interpolateColor,
    runOnJS,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { type CSSColor, Icon } from '@suite-native/icons';
import { useNativeStyles } from '@trezor/styles-native';

const ANIMATION_DURATION = 100;

type GetTrezorCardCloseIconProps = {
    onPress: () => void;
};

export const GetTrezorCardCloseIcon = ({ onPress }: GetTrezorCardCloseIconProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const isPressed = useSharedValue(0);
    const animatedColor = useDerivedValue<CSSColor>(
        () =>
            interpolateColor(
                isPressed.value,
                [0, 1],
                [colors.contentNeutral, colors.elementFillNeutralSoftPressed],
            ) as CSSColor,
    );

    const tapGesture = Gesture.Tap()
        .onBegin(() => {
            isPressed.value = withTiming(1, { duration: ANIMATION_DURATION });
        })
        .onFinalize(() => {
            isPressed.value = withTiming(0, { duration: ANIMATION_DURATION });
        })
        .onEnd(() => {
            runOnJS(onPress)();
        });

    return (
        <GestureDetector gesture={tapGesture}>
            <View collapsable={false} hitSlop={10} testID="@home/get-trezor-cta/close">
                <Icon.Animated name="x" size="mediumLarge" color={animatedColor} />
            </View>
        </GestureDetector>
    );
};
