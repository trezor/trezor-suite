import React, { useMemo } from 'react';
import { GraphPoint, LineGraph } from 'react-native-graph';

import { defaultColorVariant } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { getExtremaFromGraphPoints, sumLineGraphPoints } from '@suite-common/wallet-graph';

import { AxisLabel } from './AxisLabel';

type GraphProps = {
    points: GraphPoint[];
    loading?: boolean;
    onPointSelected?: (point: GraphPoint) => void;
    onGestureEnd?: () => void;
    animated?: boolean;
};

const graphWrapperStyle = prepareNativeStyle(_ => ({
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
}));

const graphStyle = prepareNativeStyle(_ => ({
    alignSelf: 'center',
    aspectRatio: 1.4,
    width: '100%',
}));

export const Graph = ({
    onPointSelected,
    onGestureEnd,
    points = [],
    loading = false,
    animated = true,
}: GraphProps) => {
    const { applyStyle } = useNativeStyles();
    const nonZeroSumOfGraphPoints = useMemo(() => sumLineGraphPoints(points) > 0, [points]);
    const extremaFromGraphPoints = useMemo(() => getExtremaFromGraphPoints(points), [points]);
    const axisLabels = useMemo(() => {
        if (extremaFromGraphPoints?.max && extremaFromGraphPoints?.min) {
            return {
                TopAxisLabel: () => (
                    <AxisLabel
                        x={extremaFromGraphPoints.max.x}
                        value={extremaFromGraphPoints.max.value}
                    />
                ),
                BottomAxisLabel: () => (
                    <AxisLabel
                        x={extremaFromGraphPoints.min.x}
                        value={extremaFromGraphPoints.min.value}
                    />
                ),
            };
        }
    }, [extremaFromGraphPoints]);

    // FIXME animated=true graph shows only 196 values, let's go with static for now.
    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            {!loading && nonZeroSumOfGraphPoints ? (
                <>
                    <LineGraph
                        style={applyStyle(graphStyle)}
                        points={points}
                        color={defaultColorVariant.green}
                        animated={animated}
                        verticalPadding={20}
                        enablePanGesture
                        TopAxisLabel={axisLabels?.TopAxisLabel}
                        BottomAxisLabel={axisLabels?.BottomAxisLabel}
                        onPointSelected={onPointSelected as any /* because of ExtendedGraphPoint */}
                        onGestureEnd={onGestureEnd}
                    />
                </>
            ) : (
                <Text variant="label" color="gray600">
                    {loading ? 'Loading graph data...' : 'Zero balance in this range...'}
                </Text>
            )}
        </Box>
    );
};
