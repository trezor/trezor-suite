import React from 'react';
import { LineGraph } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeSwitch } from './TimeSwitch';

const dummyData = [
    { date: new Date(2018, 15, 24, 10, 33, 30), value: 8 },
    { date: new Date(2019, 3, 24, 10, 33, 30), value: 10 },
    { date: new Date(2019, 3, 25, 10, 33, 30), value: 11 },
    { date: new Date(2019, 3, 26, 10, 33, 30), value: 15 },
    { date: new Date(2019, 3, 27, 10, 33, 30), value: 20 },
    { date: new Date(2019, 3, 28, 10, 33, 30), value: 30 },
    { date: new Date(2019, 3, 29, 10, 33, 30), value: 70 },
    { date: new Date(2019, 3, 30, 10, 33, 30), value: 10 },
];

const graphWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const graphStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: 150,
    marginVertical: 40,
}));

export const Graph = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph
                style={applyStyle(graphStyle)}
                animated
                points={dummyData}
                color="#00854D"
                enablePanGesture
                enableFadeInMask
                onGestureStart={() => {}}
            />
            <TimeSwitch />
        </Box>
    );
};
