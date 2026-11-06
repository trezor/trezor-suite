import { useState } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { AnimatedBox, Box } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber, clamp } from '@trezor/utils';

import { type GraphExtreme } from './getGraphExtremes';

type LabelPositionStyleParams = {
    left: number;
    isMeasured: boolean;
};

const labelPositionStyle = prepareNativeStyle<LabelPositionStyleParams>(
    (_, { left, isMeasured }) => ({
        position: 'absolute',
        left,
        opacity: isMeasured ? 1 : 0,
    }),
);

type ChartAxisLabelProps = {
    extreme: GraphExtreme;
};

export const ChartAxisLabel = ({ extreme: { value, relativeX } }: ChartAxisLabelProps) => {
    const [rowWidth, setRowWidth] = useState(0);
    const [labelWidth, setLabelWidth] = useState(0);

    const { applyStyle, utils } = useNativeStyles();

    const edgeGap = utils.spacings.sp8;
    const left = clamp(rowWidth * relativeX, edgeGap, rowWidth - labelWidth - edgeGap);
    const isMeasured = rowWidth > 0 && labelWidth > 0;

    return (
        <AnimatedBox
            flex={1}
            entering={FadeIn}
            exiting={FadeOut}
            onLayout={event => setRowWidth(event.nativeEvent.layout.width)}
        >
            <Box
                style={applyStyle(labelPositionStyle, { left, isMeasured })}
                onLayout={event => setLabelWidth(event.nativeEvent.layout.width)}
            >
                <BaseCurrencyAmountFormatter
                    value={asBaseCurrencyAmount(new BigNumber(value))}
                    variant="body-xs"
                    color="contentDisabled"
                    discreetMode="disabled"
                />
            </Box>
        </AnimatedBox>
    );
};
