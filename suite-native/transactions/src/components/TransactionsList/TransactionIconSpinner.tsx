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
import { useNativeStyles } from '@trezor/styles';
import { CSSColor } from '@trezor/theme';

type TransactionIconSpinnerProps = {
    radius: number;
    color: CSSColor;
    strokeWidth?: number;
};

export const TransactionIconSpinner = ({
    radius,
    color,
    strokeWidth = 8,
}: TransactionIconSpinnerProps) => {
    const { utils } = useNativeStyles();

    const rotation = useTiming({ from: 0, to: 100, loop: true }, { duration: 2500 });
    const transformRotate = useComputedValue(
        () => [{ rotate: ((2 * Math.PI) / 100) * rotation.current }],
        [rotation],
    );
    return (
        <Box style={{ position: 'absolute' }}>
            <Canvas style={{ height: radius * 2, width: radius * 2 }}>
                <Circle
                    opacity={0.7}
                    cx={radius}
                    cy={radius}
                    r={radius - strokeWidth / 2}
                    // eslint-disable-next-line react/style-prop-object
                    style="stroke"
                    strokeWidth={strokeWidth}
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
