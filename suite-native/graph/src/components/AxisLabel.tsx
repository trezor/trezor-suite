import { View } from 'react-native';
import React from 'react';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
};

const axisLabelStyle = prepareNativeStyle<Pick<AxisLabelProps, 'x'>>((_, { x }) => ({
    position: 'relative',
    left: `${x}%`,
}));

export const AxisLabel = ({ x, value }: AxisLabelProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();

    if (isDiscreetMode) return null;

    return (
        <View style={applyStyle(axisLabelStyle, { x })}>
            <FiatAmountFormatter value={String(value)} />
        </View>
    );
};
