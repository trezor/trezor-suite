import React from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeSwitch } from './TimeSwitch';
import { TimeFrameValues } from '../types';
import { generateRandomGraphData } from '../dummyData';

type GraphProps = {
    points?: GraphPoint[];
    selectedTimeFrame?: TimeFrameValues;
    onSelectTimeFrame?: (timeFrame: TimeFrameValues) => void;
};

const graphWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const graphStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: 150,
    marginVertical: 40,
}));

const POINT_COUNT = 70;
const POINTS = generateRandomGraphData(POINT_COUNT);

export const Graph = ({
    points = POINTS,
    selectedTimeFrame = 'day',
    onSelectTimeFrame,
}: GraphProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph
                style={applyStyle(graphStyle)}
                animated
                points={points}
                color="#00854D"
                enablePanGesture
                enableFadeInMask={false}
            />
            {onSelectTimeFrame && (
                <TimeSwitch
                    selectedTimeFrame={selectedTimeFrame}
                    onSelectTimeFrame={onSelectTimeFrame}
                />
            )}
        </Box>
    );
};
