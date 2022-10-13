import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Graph, TimeSwitch } from '@suite-native/graph';
import { LineGraphTimeFrameValues } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { getGraphPointsForAccounts, selectDashboardGraphPoints } from '@suite-native/wallet-graph';

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraph = () => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter } = useFormatters();
    const graphPoints = useSelector(selectDashboardGraphPoints);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');

    useEffect(() => {
        dispatch(
            getGraphPointsForAccounts({
                section: 'dashboard',
                timeFrame: selectedTimeFrame,
            }),
        );
    }, [selectedTimeFrame, dispatch]);

    /**
     * react-native-graph library has problems with rendering path when there are some invalid values.
     * Also graph is not showing (with props animated=true) when dates are not one by one.
     */
    const validGraphPoints = useMemo(
        () =>
            graphPoints
                ?.filter(point => !Number.isNaN(point.value))
                .map((point, index) => ({
                    ...point,
                    date: new Date(index),
                })),
        [graphPoints],
    );

    const handleSelectTimeFrame = (timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    // FIXME - I think it is necessary to have the same number of items in arrays we are switching between - for graphs to be animated when switching time frames...

    return (
        <Box>
            <Text variant="titleLarge">
                {/* TODO calculate this from assets  */}
                {FiatAmountFormatter.format(0)}
            </Text>
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="small">
                    <Text variant="hint" color="gray600">
                        Today, 15:45
                    </Text>
                </Box>
                <Box style={applyStyle(arrowStyle)}>
                    <Icon name="arrowUp" color="forest" size="extraSmall" />
                </Box>
                <Text color="forest" variant="hint">
                    1.3%
                </Text>
            </Box>
            <Graph
                points={
                    validGraphPoints.length
                        ? validGraphPoints
                        : [
                              {
                                  date: new Date(0),
                                  value: 0,
                              },
                          ]
                }
            />
            <TimeSwitch
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
        </Box>
    );
};
