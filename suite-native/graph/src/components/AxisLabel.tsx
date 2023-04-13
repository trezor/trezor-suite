import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
    isEndOfRange?: boolean;
};

const axisLabelStyle = prepareNativeStyle<Pick<AxisLabelProps, 'x'>>((_, { x }) => ({
    position: 'absolute',
    left: `${x}%`,
}));

export const AxisLabel = ({ x, value, isEndOfRange = false }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [textWidth, setTextWidth] = useState<null | number>(0);

    const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setTextWidth(width);
    }, []);

    // If the highest value is at the end of range, it will overflow so we need to calculate width percentage of axis label from the screen and offset it.
    const labelOffset = useMemo(() => {
        if (!isEndOfRange || !textWidth) return x;
        const textWidthPercentage = (textWidth / Dimensions.get('window').width) * 100;
        // Divide the percentage width by 2 as there is no need to move it all of the widths way
        return x - textWidthPercentage / 2;
    }, [isEndOfRange, textWidth, x]);

    if (isDiscreetMode) return null;

    return (
        <View style={applyStyle(axisLabelStyle, { x: labelOffset })} onLayout={handleTextLayout}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
