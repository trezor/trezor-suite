import React from 'react';

import {
    Canvas,
    Circle,
    vec,
    SweepGradient,
    useTiming,
    useComputedValue,
} from '@shopify/react-native-skia';

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

    const rotation = useTiming({ from: 0, to: 100, loop: true }, { duration: 2500 });
    const transformRotate = useComputedValue(
        () => [{ rotate: ((2 * Math.PI) / 100) * rotation.current }],
        [rotation],
    );
    return (
        <Box style={applyStyle(ContainerStyle)}>
            <Canvas style={{ height: radius * 2, width: radius * 2 }}>
                <Circle
                    opacity={0.7}
                    cx={radius}
                    cy={radius}
                    r={radius - STROKE_WIDTH / 2}
                    // eslint-disable-next-line react/style-prop-object
                    style="stroke"
                    strokeWidth={STROKE_WIDTH}
                >
                    <SweepGradient
                        c={vec(radius, radius)}
                        colors={[utils.colors.gray1000, color]}
                        origin={{ x: radius, y: radius }}
                        transform={transformRotate}
                    />
                </Circle>
            </Canvas>
        </Box>
    );
};
