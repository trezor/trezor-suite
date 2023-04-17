import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
};

export const MAX_CLAMP_VALUE = 90;

const axisLabelStyle = prepareNativeStyle<Pick<AxisLabelProps, 'x'>>((_, { x }) => ({
    position: 'absolute',
    left: `${x}%`,
}));

export const AxisLabel = ({ x, value }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [textWidth, setTextWidth] = useState<null | number>(0);

    const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setTextWidth(width);
    }, []);

    // If the highest value is at the end of range, it will overflow so we need to calculate width percentage of axis label from the screen and offset it.
    const labelOffset = useMemo(() => {
        if (x !== MAX_CLAMP_VALUE || !textWidth) return x;
        const textWidthPercentage = (textWidth / Dimensions.get('window').width) * 100;
        return x - textWidthPercentage;
    }, [textWidth, x]);

    if (isDiscreetMode) return null;

    return (
        <View style={applyStyle(axisLabelStyle, { x: labelOffset })} onLayout={handleTextLayout}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
