import React, { useMemo } from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { defaultColorVariant } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { getExtremaFromGraphPoints, sumLineGraphPoints } from '@suite-common/wallet-graph';

import { AxisLabel } from './AxisLabel';

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

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            {nonZeroSumOfGraphPoints ? (
                <LineGraph
                    style={applyStyle(graphStyle)}
                    points={graphPoints}
                    color={defaultColorVariant.green}
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
