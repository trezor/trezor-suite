import React, { useEffect, useState } from 'react';
import { GraphPoint } from 'react-native-graph';

import { eachMinuteOfInterval, getUnixTime, subMinutes } from 'date-fns';

import { Graph, TimeFrameValues, timeSwitchItems } from '@suite-native/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraph = () => {
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter } = useFormatters();
    const [graphPoints, setGraphPoints] = useState<GraphPoint[]>([]);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameValues>('day');

    useEffect(() => {
        const fetchFiatRates = async (startOfRangeDate: Date, endOfRangeDate: Date) => {
            const datesInRange = eachMinuteOfInterval(
                {
                    start: startOfRangeDate.getTime(),
                    end: endOfRangeDate.getTime(),
                },
                {
                    step: timeSwitchItems[selectedTimeFrame].stepInMinutes,
                },
            );

            const datesInRangeInUnixTime = datesInRange.map(date =>
                getBlockbookSafeTime(getUnixTime(date)),
            );

            const stepInMinutes = timeSwitchItems[selectedTimeFrame].stepInMinutes ?? 3600 * 24; // fallback to day

            const accountBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: 'btc',
                descriptor:
                    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
                from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
                to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
                groupBy: stepInMinutes * 60,
            });

            console.log('accountBalanceHistory: ', accountBalanceHistory);

            const ratesForDatesInRange = await getFiatRatesForTimestamps(
                { symbol: 'btc' },
                datesInRangeInUnixTime,
            )
                .then(res => (res?.tickers || []).map(({ ts, rates }) => [ts, rates]))
                .then(res => Object.fromEntries(res));

            const mappedDatesInRange = Object.keys(ratesForDatesInRange).map(timestamp => {
                const fiatRates = ratesForDatesInRange[timestamp];
                return {
                    date: new Date(Number(timestamp) * 1000),
                    value: Math.floor(fiatRates.usd),
                };
            });
            setGraphPoints(mappedDatesInRange);
        };

        const endOfRangeDate = new Date();

        const subNumberOfMinutes = timeSwitchItems[selectedTimeFrame].valueBackInMinutes;

        // TODO do time frame 'all' later in follow up
        if (subNumberOfMinutes) {
            const startOfRangeDate = subMinutes(endOfRangeDate, subNumberOfMinutes);
            fetchFiatRates(startOfRangeDate, endOfRangeDate);
        }
    }, [selectedTimeFrame]);

    const handleSelectTimeFrame = (timeFrame: TimeFrameValues) => {
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
