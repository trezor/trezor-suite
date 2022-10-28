import React, { useMemo } from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { defaultColorVariant } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { getExtremaFromGraphPoints, sumLineGraphPoints } from '@suite-common/wallet-graph';

import { AxisLabel } from './AxisLabel';

type GraphProps = {
    points: GraphPoint[];
    loading?: boolean;
};

const graphWrapperStyle = prepareNativeStyle(_ => ({
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
}));

const graphStyle = prepareNativeStyle(_ => ({
    alignSelf: 'center',
    aspectRatio: 1.4,
    width: '100%',
}));

const axisLabelStyle = prepareNativeStyle(_ => ({
    alignSelf: 'center',
    width: '100%',
}));

export const Graph = ({ points = [], loading = false }: GraphProps) => {
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

    const graphPoints = points.length
        ? points
        : [
              {
                  date: new Date(0),
                  value: 0,
              },
          ];

    // FIXME animated=true graph shows only 196 values, let's go with static for now.
    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            {!loading && nonZeroSumOfGraphPoints ? (
                <>
                    <Box style={applyStyle(axisLabelStyle)}>{axisLabels?.TopAxisLabel()}</Box>
                    <LineGraph
                        style={applyStyle(graphStyle)}
                        points={graphPoints}
                        color={defaultColorVariant.green}
                        animated={false}
                        // enablePanGesture
                        // TopAxisLabel={axisLabels?.TopAxisLabel}
                        // BottomAxisLabel={axisLabels?.BottomAxisLabel}
                    />
                    <Box style={applyStyle(axisLabelStyle)}>{axisLabels?.BottomAxisLabel()}</Box>
                </>
            ) : (
                <Text variant="label" color="gray600">
                    {loading ? 'Loading graph data...' : 'Zero balance in this range...'}
                </Text>
            )}
        </Box>
    );
};
