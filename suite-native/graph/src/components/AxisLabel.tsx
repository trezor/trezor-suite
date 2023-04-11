import { LayoutChangeEvent, View } from 'react-native';
import React from 'react';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
};

const axisLabelStyle = prepareNativeStyle<
    { elementWidth: number | null } & Pick<AxisLabelProps, 'x'>
>((_, { x, elementWidth }) => ({
    position: 'absolute',
    left: `${x}%`,
    extend: {
        condition: !!elementWidth,
        style: {
            left: `${x - Number(elementWidth)}%`,
        },
    },
}));

export const AxisLabel = ({ x, value }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [elementWidth, setElementWidth] = React.useState<number | null>(null);

    if (isDiscreetMode) return null;

    const handleLayoutEvent = (nativeEvent: LayoutChangeEvent) => {
        setElementWidth(nativeEvent.nativeEvent.layout.width);
    };

    return (
        <View style={applyStyle(axisLabelStyle, { x, elementWidth })} onLayout={handleLayoutEvent}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
