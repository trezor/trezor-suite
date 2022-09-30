import React, { useEffect, useState } from 'react';

import { eachMinuteOfInterval, getUnixTime, subDays, subHours } from 'date-fns';

import { Graph } from '@suite-native/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { TimeFrameValues } from '@suite-native/graph/libDev/src/types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraph = () => {
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter } = useFormatters();
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameValues>('day');

    const getDatesInSelectedTimeFrame = (timeFrame: TimeFrameValues) => {
        const endOfRangeDate = new Date();

        switch (timeFrame) {
            case 'day': {
                const startOfRangeDate = subDays(endOfRangeDate, 1);
                return eachMinuteOfInterval(
                    {
                        start: startOfRangeDate.getTime(),
                        end: endOfRangeDate.getTime(),
                    },
                    {
                        step: 30,
                    },
                );
            }
            case 'hour': {
                const startOfRangeDate = subHours(endOfRangeDate, 1);
                return eachMinuteOfInterval(
                    {
                        start: startOfRangeDate.getTime(),
                        end: endOfRangeDate.getTime(),
                    },
                    {
                        step: 5,
                    },
                );
            }
            default:
        }
        return [];
    };

    useEffect(() => {
        const getFiatRates = async (datesInRangeInUnixTime: number[]) => {
            const ratesForDatesInRange = await getFiatRatesForTimestamps(
                { symbol: 'btc' },
                datesInRangeInUnixTime,
            );
            console.log('**************\n');
            console.log('**************\n');
            console.log('ratesForDatesInRangeratesForDatesInRange: ', ratesForDatesInRange);
            console.log('**************\n');
            console.log('**************\n');
        };

        console.log('renderuju se: ', selectedTimeFrame);
        const datesInRange = getDatesInSelectedTimeFrame(selectedTimeFrame);
        const datesInRangeInUnixTime = datesInRange.map(date => getUnixTime(date));
        getFiatRates(datesInRangeInUnixTime);
    }, [selectedTimeFrame]);

    const handleSelectTimeFrame = (timeFrame: TimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

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
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
        </Box>
    );
};
