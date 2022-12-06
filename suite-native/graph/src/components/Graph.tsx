import React, { useMemo } from 'react';
import { GraphPoint, LineGraph } from 'react-native-graph';
import { ActivityIndicator } from 'react-native';

import { N } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

import {
    getExtremaFromGraphPoints,
    EnhancedGraphPointWithCryptoBalance,
    EnhancedGraphPoint,
} from '../utils';
import { AxisLabel } from './AxisLabel';
import { GraphError } from './GraphError';

type GraphProps<TGraphPoint extends GraphPoint> = {
    points: TGraphPoint[];
    loading?: boolean;
    onPointSelected?: (point: TGraphPoint) => void;
    onGestureEnd?: () => void;
    animated?: boolean;
    error?: string | null;
    onTryAgain: () => void;
};

const GRAPH_HEIGHT = 250;

export const graphWrapperStyle = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    height: GRAPH_HEIGHT,
    alignItems: 'center',
}));

export const graphMessageStyleContainer = prepareNativeStyle(_ => ({
    position: 'absolute',
    width: '100%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
}));

type GraphStyleProps = {
    loading: boolean;
    error?: string | null;
};
const graphStyle = prepareNativeStyle<GraphStyleProps>((_, { loading, error }) => ({
    alignSelf: 'center',
    height: GRAPH_HEIGHT,
    width: '100%',
    opacity: loading || !!error ? 0.1 : 1,
}));

export const emptyGraphPoint: EnhancedGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
    originalDate: new Date(),
};

const emptyPoints: EnhancedGraphPointWithCryptoBalance[] = [
    { ...emptyGraphPoint },
    { ...emptyGraphPoint, date: new Date(1) },
];

// to avoid overflows from the screen
const clampAxisLabels = (value: number) => N.clamp(value, 5, 90);

export const Graph = <TGraphPoint extends EnhancedGraphPoint>({
    onPointSelected,
    onGestureEnd,
    points = [],
    loading = false,
    animated = true,
    onTryAgain,
    error,
}: GraphProps<TGraphPoint>) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const isPointsEmpty = points.length <= 1;

    const nonEmptyPoints = isPointsEmpty ? emptyPoints : points;
    const extremaFromGraphPoints = useMemo(() => getExtremaFromGraphPoints(points), [points]);
    const axisLabels = useMemo(() => {
        if (extremaFromGraphPoints?.max && extremaFromGraphPoints?.min) {
            return {
                TopAxisLabel: () => (
                    <AxisLabel
                        x={clampAxisLabels(extremaFromGraphPoints.max.x)}
                        value={extremaFromGraphPoints.max.value}
                    />
                ),
                BottomAxisLabel: () => (
                    <AxisLabel
                        x={clampAxisLabels(extremaFromGraphPoints.min.x)}
                        value={extremaFromGraphPoints.min.value}
                    />
                ),
            };
        }
    }, [extremaFromGraphPoints]);

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph
                style={applyStyle(graphStyle, { loading, error })}
                points={nonEmptyPoints}
                color={colors.green}
                animated={animated}
                verticalPadding={20}
                enablePanGesture
                TopAxisLabel={axisLabels?.TopAxisLabel}
                BottomAxisLabel={axisLabels?.BottomAxisLabel}
                onPointSelected={onPointSelected as any /* because of ExtendedGraphPoint */}
                onGestureEnd={onGestureEnd}
            />
            {loading && (
                <Box style={applyStyle(graphMessageStyleContainer)}>
                    <ActivityIndicator size="large" color={colors.green} />
                    <Text variant="label" color="gray600">
                        Loading graph data...
                    </Text>
                </Box>
            )}
            {error && !loading && (
                <Box style={applyStyle(graphMessageStyleContainer)}>
                    <GraphError error={error} onTryAgain={onTryAgain} />
                </Box>
            )}
        </Box>
    );
};
