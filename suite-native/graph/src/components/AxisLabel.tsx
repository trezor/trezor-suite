import React from 'react';
import { View } from 'react-native';

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

// TODO: this is a temporary solution, we should use some kind of font metrics to calculate the width of the label
const APPROXIMATE_DIGIT_WIDTH = 1.75;

export const AxisLabel = ({ x, value, isHighestValue = false }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();

    if (isDiscreetMode) return null;

    const offset = String(value).length * APPROXIMATE_DIGIT_WIDTH;

    const labelOffset = isHighestValue ? x - offset : x;

    return (
        <View style={applyStyle(axisLabelStyle, { x: labelOffset })}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
