import React, { useMemo } from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { sumLineGraphPoints } from '@suite-common/wallet-graph';

import { AxisLabel } from './AxisLabel';
import {
    getAxisLabelPercentagePosition,
    maxGraphPointArrayItemIndex,
    minGraphPointArrayItemIndex,
} from '../utils';

type GraphProps = {
    points: GraphPoint[];
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

export const Graph = ({ points = [] }: GraphProps) => {
    const { applyStyle } = useNativeStyles();

    const nonZeroSumOfGraphPoints = useMemo(() => sumLineGraphPoints(points) > 0, [points]);

    const extremaFromGraphPoints = useMemo(() => {
        const numberOfPoints = points.length;
        if (numberOfPoints > 0 && nonZeroSumOfGraphPoints) {
            const maxGraphPointIndex = maxGraphPointArrayItemIndex(points);
            const minGraphPointIndex = minGraphPointArrayItemIndex(points);

            const { value: pointMaxima } = points[maxGraphPointIndex];
            const { value: pointMinima } = points[minGraphPointIndex];

            return {
                max: {
                    x: getAxisLabelPercentagePosition(maxGraphPointIndex, numberOfPoints),
                    value: pointMaxima,
                },
                min: {
                    x: getAxisLabelPercentagePosition(minGraphPointIndex, numberOfPoints),
                    value: pointMinima,
                },
            };
        }
    }, [points, nonZeroSumOfGraphPoints]);

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

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            {nonZeroSumOfGraphPoints ? (
                <LineGraph
                    style={applyStyle(graphStyle)}
                    points={graphPoints}
                    color="#00854D"
                    animated
                    enablePanGesture
                    TopAxisLabel={axisLabels?.TopAxisLabel}
                    BottomAxisLabel={axisLabels?.BottomAxisLabel}
                />
            ) : (
                <Text variant="label" color="gray600">
                    Zero balance in this range...
                </Text>
            )}
        </Box>
    );
};
