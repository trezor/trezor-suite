import React from 'react';
import { LineGraph } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeSwitch } from './TimeSwitch';
import { dummyData } from '../constants';

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
