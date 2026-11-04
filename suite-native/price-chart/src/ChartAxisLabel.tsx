import { useState } from 'react';
import { FadeIn } from 'react-native-reanimated';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { AnimatedBox, Box } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { type GraphExtreme } from './getGraphExtremes';

type LabelPositionStyleParams = {
    left: number;
    isMeasured: boolean;
};

const labelPositionStyle = prepareNativeStyle<LabelPositionStyleParams>(
    (_, { left, isMeasured }) => ({
        position: 'absolute',
        left,
        // Hidden until both widths are known, so the label never flashes at an unclamped position.
        opacity: isMeasured ? 1 : 0,
    }),
);

type GetLabelLeftParams = {
    relativeX: number;
    rowWidth: number;
    labelWidth: number;
    edgeGap: number;
};

// The label starts where its point lies, but never runs past either edge of the graph.
const getLabelLeft = ({ relativeX, rowWidth, labelWidth, edgeGap }: GetLabelLeftParams) =>
    Math.max(edgeGap, Math.min(rowWidth * relativeX, rowWidth - labelWidth - edgeGap));

type ChartAxisLabelProps = {
    extreme: GraphExtreme;
};

/** The fiat value of a graph's high or low, written where the line reaches it. */
export const ChartAxisLabel = ({ extreme: { value, relativeX } }: ChartAxisLabelProps) => {
    const [rowWidth, setRowWidth] = useState(0);
    const [labelWidth, setLabelWidth] = useState(0);

    const { applyStyle, utils } = useNativeStyles();

    const left = getLabelLeft({ relativeX, rowWidth, labelWidth, edgeGap: utils.spacings.sp8 });
    const isMeasured = rowWidth > 0 && labelWidth > 0;

    return (
        <AnimatedBox
            flex={1}
            entering={FadeIn}
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
