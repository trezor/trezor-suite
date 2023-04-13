import React from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
    isHighestValue?: boolean;
};

const axisLabelStyle = prepareNativeStyle<Pick<AxisLabelProps, 'x'>>((_, { x }) => ({
    position: 'absolute',
    left: `${x}%`,
}));

export const AxisLabel = ({ x, value, isHighestValue = false }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [elementWidth, setElementWidth] = React.useState<number | null>(null);

    if (isDiscreetMode) return null;

    const offset = String(value).length * 1.75;

    const labelOffset = isHighestValue ? x - offset : x;

    const handleLayoutEvent = (nativeEvent: LayoutChangeEvent) => {
        setElementWidth(nativeEvent.nativeEvent.layout.width);
    };

    return (
        <View style={applyStyle(axisLabelStyle, { x: labelOffset })} onLayout={handleLayoutEvent}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
