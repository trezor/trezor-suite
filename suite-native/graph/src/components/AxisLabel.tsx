import { useState } from 'react';
import { View } from 'react-native';

import { useDiscreetMode } from '@suite-common/discreet-mode';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

type AxisLabelProps = {
    x: number;
    value: number;
    graphWidth: number;
};

const axisLabelStyle = prepareNativeStyle<{ left: number; isMeasured: boolean }>(
    (_, { left, isMeasured }) => ({
        position: 'absolute',
        left,
        opacity: isMeasured ? 1 : 0,
    }),
);

export const AxisLabel = ({ x, value, graphWidth }: AxisLabelProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const [labelWidth, setLabelWidth] = useState(0);
    const padding = utils.spacings.sp8;
    const left = Math.max(
        padding,
        Math.min((graphWidth * x) / 100, graphWidth - labelWidth - padding),
    );

    if (isDiscreetMode) return null;

    return (
        <View
            style={applyStyle(axisLabelStyle, {
                left,
                isMeasured: graphWidth > 0 && labelWidth > 0,
            })}
            onLayout={event => setLabelWidth(event.nativeEvent.layout.width)}
        >
            <BaseCurrencyAmountFormatter
                value={asBaseCurrencyAmount(new BigNumber(value))}
                variant="body-xs"
                color="contentDisabled"
            />
        </View>
    );
};
