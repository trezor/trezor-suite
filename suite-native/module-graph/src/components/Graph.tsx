import React from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeSwitch } from './TimeSwitch';
import { TimeFrameValues } from '../types';

type GraphProps = {
    points: GraphPoint[];
    defaultTimeFrame?: TimeFrameValues;
    hasTimeSwitch?: boolean;
};

const graphWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const graphStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: 150,
    marginVertical: 40,
}));

export const Graph = ({ points, defaultTimeFrame, hasTimeSwitch = true }: GraphProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph
                style={applyStyle(graphStyle)}
                animated
                points={points}
                color="#00854D"
                enablePanGesture
                enableFadeInMask
            />
            {hasTimeSwitch && <TimeSwitch defaultTimeFrame={defaultTimeFrame} />}
        </Box>
    );
};
