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

import { Box } from '@suite-native/atoms';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { Color } from '@trezor/theme';

type TransactionIconSpinnerProps = {
    radius: number;
    color: Color;
};

const FULL_CIRCLE_TURN = 360;
const ROTATION_DURATION = 2500;
const WITH_REPEAT_INFINITE = -1;
const STROKE_WIDTH = 8;

const ContainerStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
}));

export const TransactionIconSpinner = ({ radius, color }: TransactionIconSpinnerProps) => {
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
            WITH_REPEAT_INFINITE,
        );
        return () => cancelAnimation(rotation);
    }, [rotation]);

    return (
        <Box style={applyStyle(ContainerStyle)}>
            <Animated.View style={animatedStyles}>
                <Canvas style={{ height: radius * 2, width: radius * 2 }}>
                    <Circle
                        opacity={0.75}
                        cx={radius}
                        cy={radius}
                        r={radius - STROKE_WIDTH / 2}
                        style="stroke"
                        strokeWidth={STROKE_WIDTH}
                    >
                        <SweepGradient
                            c={vec(radius, radius)}
                            colors={[utils.colors.backgroundSurfaceElevation1, utils.colors[color]]}
                            origin={{ x: radius, y: radius }}
                        />
                    </Circle>
                </Canvas>
            </Animated.View>
        </Box>
    );
};
