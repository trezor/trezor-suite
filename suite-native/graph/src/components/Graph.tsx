import React from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';
import { LineGraphTimeFrameValues } from '@suite-common/wallet-types';

import { TimeSwitch } from './TimeSwitch';

type GraphProps = {
    points?: GraphPoint[];
    selectedTimeFrame?: LineGraphTimeFrameValues;
    onSelectTimeFrame?: (timeFrame: LineGraphTimeFrameValues) => void;
};

const graphWrapperStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 1.4,
}));

const graphStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: 150,
    marginVertical: 40,
}));

export const Graph = ({
    points = [],
    selectedTimeFrame = 'day',
    onSelectTimeFrame,
}: GraphProps) => {
    const { applyStyle } = useNativeStyles();

    const validGraphPoints = points?.filter(point => !Number.isNaN(point.value));

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            {validGraphPoints.length ? (
                <LineGraph
                    style={applyStyle(graphStyle)}
                    animated={false}
                    points={validGraphPoints}
                    color="#00854D"
                />
            ) : null}
            {onSelectTimeFrame && (
                <TimeSwitch
                    selectedTimeFrame={selectedTimeFrame}
                    onSelectTimeFrame={onSelectTimeFrame}
                />
            )}
        </Box>
    );
};
