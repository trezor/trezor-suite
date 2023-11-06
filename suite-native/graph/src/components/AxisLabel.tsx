import { useCallback, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
};

type AxisLabelStyleProps = {
    x: number;
    isOverflowing: boolean;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

export const MAX_CLAMP_VALUE = 90;

const axisLabelStyle = prepareNativeStyle<AxisLabelStyleProps>((_, { x, isOverflowing }) => ({
    position: 'absolute',
    left: `${x}%`,
    extend: {
        // Position the axis label from the right if it's overflowing the screen width.
        condition: isOverflowing,
        style: {
            left: undefined,
            right: 0,
        },
    },
}));

export const AxisLabel = ({ x, value }: AxisLabelProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const viewRef = useRef<View>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const handleLayoutOverflow = useCallback(() => {
        if (viewRef.current) {
            viewRef.current.measureInWindow((viewX, _, viewWidth) => {
                const graphHorizontalPadding = utils.spacings.s;
                // The right most pixel of the axis label is overflowing the graph width.
                if (viewX + viewWidth + graphHorizontalPadding > SCREEN_WIDTH) {
                    setIsOverflowing(true);
                }
            });
        }
    }, [utils]);

    if (isDiscreetMode) return null;

    return (
        <View
            style={applyStyle(axisLabelStyle, { x, isOverflowing })}
            onLayout={handleLayoutOverflow}
            ref={viewRef}
        >
            <FiatAmountFormatter value={String(value)} variant="label" color="textDisabled" />
        </View>
    );
};
