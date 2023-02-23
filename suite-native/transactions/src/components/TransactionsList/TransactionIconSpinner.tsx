import React, { useEffect } from 'react';
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
import { CSSColor } from '@trezor/theme';

type TransactionIconSpinnerProps = {
    radius: number;
    color: CSSColor;
};

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
            withTiming(360, {
                duration: 2500,
                easing: Easing.linear,
            }),
            -1,
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
                        // eslint-disable-next-line react/style-prop-object
                        style="stroke"
                        strokeWidth={STROKE_WIDTH}
                    >
                        <SweepGradient
                            c={vec(radius, radius)}
                            colors={[utils.colors.gray0, utils.colors[color]]}
                            origin={{ x: radius, y: radius }}
                        />
                    </Circle>
                </Canvas>
            </Animated.View>
        </Box>
    );
};
