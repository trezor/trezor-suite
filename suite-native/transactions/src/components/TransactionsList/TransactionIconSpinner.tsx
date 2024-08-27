import { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';

import { Canvas, Circle, vec, SweepGradient } from '@shopify/react-native-skia';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { ENDLESS_ANIMATION_VALUE } from '@suite-native/helpers';

type TransactionIconSpinnerProps = {
    size: number;
    color: Color;
    width?: number;
};

const FULL_CIRCLE_TURN = 360;
const ROTATION_DURATION = 2500;
const DEFAULT_STROKE_WIDTH = 8;

const ContainerStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
}));

export const TransactionIconSpinner = ({
    size,
    color,
    width = DEFAULT_STROKE_WIDTH,
}: TransactionIconSpinnerProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const rotation = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(
        () => ({
            transform: [
                {
                    rotateZ: `${rotation.value}deg`,
                },
            ],
        }),
        [rotation.value],
    );

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(FULL_CIRCLE_TURN, {
                duration: ROTATION_DURATION,
                easing: Easing.linear,
            }),
            ENDLESS_ANIMATION_VALUE,
        );

        return () => cancelAnimation(rotation);
    }, [rotation]);

    const radius = size / 2;

    return (
        <Animated.View style={[animatedStyles, applyStyle(ContainerStyle)]}>
            <Canvas style={{ height: size, width: size }}>
                <Circle
                    opacity={0.75}
                    cx={radius}
                    cy={radius}
                    r={radius - width / 2}
                    style="stroke"
                    strokeWidth={width}
                >
                    <SweepGradient
                        c={vec(radius, radius)}
                        colors={[utils.colors.backgroundSurfaceElevation1, utils.colors[color]]}
                        origin={{ x: radius, y: radius }}
                    />
                </Circle>
            </Canvas>
        </Animated.View>
    );
};
