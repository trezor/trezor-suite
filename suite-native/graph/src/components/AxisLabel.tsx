import { View } from 'react-native';
import React from 'react';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';

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
    const { FiatAmountFormatter } = useFormatters();

    return (
        <View style={applyStyle(axisLabelStyle, { x })}>
            <Text variant="label" color="gray600">
                {FiatAmountFormatter.format(value)}
            </Text>
        </View>
    );
};
