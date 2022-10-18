import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Graph, TimeSwitch } from '@suite-native/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useFormatters } from '@suite-common/formatters';
import {
    getGraphPointsForAccountsThunk,
    selectDashboardGraphPoints,
    LineGraphTimeFrameValues,
} from '@suite-common/wallet-graph';

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraph = () => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const graphPoints = useSelector(selectDashboardGraphPoints);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');

    useEffect(() => {
        dispatch(
            getGraphPointsForAccountsThunk({
                section: 'dashboard',
                fiatCurrency: fiatCurrency.label,
                timeFrame: selectedTimeFrame,
            }),
        );
    }, [selectedTimeFrame, fiatCurrency, dispatch]);

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
            <Graph points={graphPoints} />
            <TimeSwitch
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
        </Box>
    );
};
