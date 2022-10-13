import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { subMinutes } from 'date-fns';

import { Graph, timeSwitchItems } from '@suite-native/graph';
import { LineGraphTimeFrameValues } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { getGraphDataForAccounts, selectDashboardGraphPoints } from '@suite-native/wallet-graph';

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
        const endOfRangeDate = new Date();
        const subNumberOfMinutes = timeSwitchItems[selectedTimeFrame].valueBackInMinutes;

        // TODO do time frame 'all' later
        if (subNumberOfMinutes) {
            const startOfRangeDate = subMinutes(endOfRangeDate, subNumberOfMinutes);
            const stepInMinutes = timeSwitchItems[selectedTimeFrame].stepInMinutes ?? 3600 * 24; // fallback to day
            dispatch(
                getGraphDataForAccounts({
                    section: 'dashboard',
                    stepInMinutes,
                    startOfRangeDate,
                    endOfRangeDate,
                    accounts: [], // TODO
                }),
            );
        }
    }, [selectedTimeFrame, dispatch]);

    const handleSelectTimeFrame = (timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    console.log('graphPoints: ', graphPoints);

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
                points={graphPoints}
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
        </Box>
    );
};
